import { avisarPagamentoNaoReconhecido, avisarEstornoSemRevogacao } from './avisos';
import { normalizarTelefoneE164 } from './telefone';
import { sha256 } from './cripto';
import { contaDoTelefone, formatarSerial, gerarSerial } from './serial';

/**
 * Núcleo comum aos webhooks de pagamento (hoje: Hotmart). Quando a compra é paga, o Worker libera o
 * acesso de 30 dias (mensal) ou 365 dias (anual) na conta do telefone do comprador, gera um serial novo
 * e o entrega pelo WhatsApp. Quem já usa o teste não precisa reativar: o acesso pago vale na hora
 * para os aparelhos já ativados. Estorno e chargeback revogam o acesso daquela compra.
 *
 * Acesso e mensagens do serial são gravados no MESMO lote (transação): ou o comprador recebe o acesso
 * e o serial na fila, ou nada muda e o evento é desfeito para o reenvio do provedor tentar de novo.
 * Assim não existe "pago, liberado, mas sem serial".
 *
 * Configuração de planos (wrangler.toml [vars]): PRODUTOS_MENSAL e PRODUTOS_ANUAL (códigos separados
 * por vírgula). Só o código decide o plano.
 */
const UM_DIA_MS = 24 * 3600 * 1000;
const PLANOS = { monthly: { dias: 30, rotulo: 'mensal' }, annual: { dias: 365, rotulo: 'anual' } };

export function resposta(corpo, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

const texto = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');
const normalizar = (v) => texto(v).toLowerCase().replace(/[\s-]+/g, '_');
const lista = (v) => texto(v).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const semAcento = (v) => texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const chave = (v) => semAcento(v).replace(/[^a-z0-9]/g, '');
const palavras = (v) => semAcento(v).split(/[^a-z0-9]+/).filter(Boolean);

/** Lê o corpo como JSON ou formulário (a[b]=1 vira { a: { b: 1 } }). */
export async function lerCorpo(request) {
  const bruto = await request.text();
  if (bruto.length > 64_000) return null;
  try { return JSON.parse(bruto); } catch { /* tenta formulário */ }
  try {
    const dados = {};
    for (const [chave, valor] of new URLSearchParams(bruto)) {
      const caminho = chave.replace(/\]/g, '').split('[');
      let alvo = dados;
      caminho.slice(0, -1).forEach((parte) => { alvo = alvo[parte] ??= {}; });
      alvo[caminho[caminho.length - 1]] = valor;
    }
    return Object.keys(dados).length ? dados : null;
  } catch { return null; }
}

/** Telefone do comprador em E.164: respeita o DDI que veio no checkout (ver telefone.js). */
export function telefoneDoComprador(bruto, paisIso) {
  return normalizarTelefoneE164(bruto, { paisIso });
}

/**
 * Mensal ou anual SÓ pelo código do produto/oferta configurado (PRODUTOS_MENSAL / PRODUTOS_ANUAL),
 * ignorando espaços e pontuação. Nome do produto e valor pago não liberam plano: quem tiver o hottok
 * não consegue ganhar acesso com um produto de nome parecido ou um preço qualquer. Compra de código
 * novo (ex.: oferta nova) fica registrada como plano_desconhecido e avisa a equipe para cadastrar o código.
 */
function planoDaCompra(env, dados) {
  const mensais = lista(env.PRODUTOS_MENSAL).map(chave);
  const anuais = lista(env.PRODUTOS_ANUAL).map(chave);
  const codigos = (dados.produtos ?? []).map(chave).filter(Boolean);
  if (codigos.some((p) => anuais.includes(p))) return 'annual';
  if (codigos.some((p) => mensais.includes(p))) return 'monthly';
  return null;
}

// a chave do evento é compra + tipo: o pagamento e o estorno da mesma compra são avisos diferentes
async function registrarEvento(db, provedor, idEvento, tipo, hash, resumo, iso) {
  const r = await db.prepare(
    `INSERT OR IGNORE INTO payment_events (provider, event_id, event_type, payload_hash, signature_valid, payload, created_at)
     VALUES (?6, ?1 || ':' || ?2, ?2, ?3, 1, ?4, ?5)`,
  ).bind(idEvento, tipo, hash, resumo, iso, provedor).run();
  return r?.meta?.changes === 1;
}

const concluir = (db, provedor, idEvento, tipo, resultado, iso) => db.prepare(
  "UPDATE payment_events SET processed_at = ?, processing_result = ? WHERE provider = ? AND event_id = ? || ':' || ?",
).bind(iso, resultado, provedor, idEvento, tipo).run();

function mensagemDeLiberacao({ fim, rotulo, plano }, link, telefone) {
  if (telefone.startsWith('+44')) {
    const ate = new Date(fim).toLocaleDateString('en-GB', { timeZone: 'Europe/London' });
    return `Payment confirmed! 🎉 Your Leviã ${plano === 'annual' ? 'annual' : 'monthly'} plan is active until ${ate}.\n\n` +
      `If you already use the app, your access is active. To activate now, open ${link}, tap "Ativar" and enter the serial in the next message 👇`;
  }
  if (telefone.startsWith('+34')) {
    const ate = new Date(fim).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });
    return `¡Pago confirmado! 🎉 Tu plan ${plano === 'annual' ? 'anual' : 'mensual'} de Leviã está activo hasta el ${ate}.\n\n` +
      `Si ya usas la aplicación, tu acceso está activo. Para activar ahora, abre ${link}, pulsa "Ativar" e introduce el serial del siguiente mensaje 👇`;
  }
  // Sem preferência de idioma no pagamento: inglês é o fallback para outros DDIs.
  if (!telefone.startsWith('+55')) {
    const ate = new Date(fim).toLocaleDateString('en-GB', { timeZone: 'UTC' });
    return `Payment confirmed! 🎉 Your Leviã ${plano === 'annual' ? 'annual' : 'monthly'} plan is active until ${ate} (UTC).\n\n` +
      `If you already use the app, your access is active. To activate now, open ${link}, tap "Ativar" and enter the serial in the next message 👇`;
  }
  const ate = new Date(fim).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return `Pagamento confirmado! 🎉 Seu plano ${rotulo} do Leviã está liberado até ${ate}.\n\n` +
    `Se você já usa o app, ele já está liberado, não precisa fazer nada. Se for ativar agora, abra ${link}, toque em "Ativar" e cole o serial que vou enviar na próxima mensagem 👇`;
}

/**
 * Libera o plano, troca o serial e põe as duas mensagens na fila do WhatsApp num único lote.
 * Prefixo "pgto-": mensagem transacional de compra, entregue mesmo sem sessão aberta
 * (quem pagou pela landing pode nunca ter falado com o bot e precisa receber o serial).
 */
async function liberarAcesso(env, conta, plano, idEvento, agora, telefone, link) {
  const db = env.LEVIA_DB;
  const iso = new Date(agora).toISOString();
  const { dias, rotulo } = PLANOS[plano];
  // renovar antes de vencer soma ao tempo que já existe
  const atual = await db.prepare(
    `SELECT MAX(current_period_end) AS fim FROM entitlements WHERE account_id = ? AND status = 'active'`,
  ).bind(conta.id).first();
  const inicio = Math.max(agora, atual?.fim ? Date.parse(atual.fim) : 0);
  const fim = new Date(inicio + dias * UM_DIA_MS).toISOString();
  const direitoId = crypto.randomUUID();
  const serial = gerarSerial();
  const formatado = formatarSerial(serial);
  const mensagens = [mensagemDeLiberacao({ fim, rotulo, plano }, link, telefone), formatado];
  await db.batch([
    db.prepare(
      `INSERT INTO entitlements (id, account_id, plan, status, photo_limit, current_period_start, current_period_end, last_payment_id, created_at, updated_at)
       VALUES (?1, ?2, ?3, 'active', ?4, ?5, ?6, ?7, ?8, ?8)`,
    ).bind(direitoId, conta.id, plano, Number(env.FOTOS_ASSINANTE_30D || 100), new Date(inicio).toISOString(), fim, idEvento, iso),
    db.prepare('UPDATE activation_codes SET invalidated_at = ? WHERE account_id = ? AND invalidated_at IS NULL').bind(iso, conta.id),
    db.prepare(
      'INSERT INTO activation_codes (id, account_id, entitlement_id, code_hash, issued_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), conta.id, direitoId, await sha256(serial), iso, fim),
    ...mensagens.map((msg) => db.prepare(
      'INSERT INTO wa_outbox (id, phone, texto, enviar_em, criado_em) VALUES (?, ?, ?, ?, ?)',
    ).bind(`pgto-${crypto.randomUUID()}`, telefone, msg, agora, agora)),
  ]);
  return { serial: formatado, fim, rotulo };
}

/**
 * Núcleo comum aos provedores de pagamento (hoje: Hotmart). `tipo` = 'paid' | 'reverted';
 * `dados` = { idEvento, telefone, produtos, valorCentavos }. O aviso repetido é ignorado e
 * telefone ausente ou plano desconhecido ficam registrados em payment_events para conferência.
 */
export async function processarPagamento(env, provedor, tipo, dados, corpo, agora = Date.now()) {
  const db = env.LEVIA_DB;
  const iso = new Date(agora).toISOString();
  const hash = await sha256(JSON.stringify(corpo));
  // resumo sem telefone, nome ou e-mail: só o suficiente para entender por que um plano não foi reconhecido
  const resumo = JSON.stringify({
    produtos: dados.produtos ?? [],
    valorCentavos: dados.valorCentavos ?? 0,
    ...(dados.resumo && typeof dados.resumo === 'object' ? dados.resumo : {}),
  }).slice(0, 4000);
  // o provedor reenvia o mesmo aviso: só o primeiro de cada compra e tipo é processado
  if (!(await registrarEvento(db, provedor, dados.idEvento, tipo, hash, resumo, iso))) return resposta({ ok: true, duplicado: true });

  // Se algo falhar ANTES de o acesso mudar, o registro do evento é desfeito: assim o reenvio
  // do provedor (que vem depois do 500) processa de novo em vez de cair em "duplicado" e deixar
  // uma compra paga sem acesso. Depois que o acesso mudou, o registro fica, para não liberar duas vezes.
  const estado = { acessoAlterado: false };
  try {
    return await processarEventoRegistrado(env, db, provedor, tipo, dados, iso, agora, estado);
  } catch (e) {
    if (!estado.acessoAlterado) {
      try {
        await db.prepare('DELETE FROM payment_events WHERE provider = ? AND event_id = ? || \':\' || ?')
          .bind(provedor, dados.idEvento, tipo).run();
      } catch (e2) {
        console.error(`${provedor}: não consegui desfazer o registro do evento`, dados.idEvento, e2?.message);
      }
    }
    console.error(`${provedor}: falha ao processar`, dados.idEvento, e?.message);
    throw e;
  }
}

async function processarEventoRegistrado(env, db, provedor, tipo, dados, iso, agora, estado) {
  // Estorno/chargeback/cancelamento revoga pelo ID da transação (o mesmo gravado em
  // entitlements.last_payment_id na liberação). Não depende do telefone: se o número do evento
  // não for reconhecido, o acesso pago ainda assim é revogado. Sem nada para revogar, a equipe é avisada.
  if (tipo === 'reverted') {
    const [direitos] = await db.batch([
      db.prepare(
        "UPDATE entitlements SET status = 'revoked', updated_at = ?1 WHERE last_payment_id = ?2 AND status = 'active'",
      ).bind(iso, dados.idEvento),
      db.prepare(
        `UPDATE activation_codes SET invalidated_at = ?1 WHERE invalidated_at IS NULL
         AND entitlement_id IN (SELECT id FROM entitlements WHERE last_payment_id = ?2)`,
      ).bind(iso, dados.idEvento),
    ]);
    if ((direitos?.meta?.changes ?? 0) > 0) {
      estado.acessoAlterado = true;
      await concluir(db, provedor, dados.idEvento, tipo, 'revogado', iso);
      return resposta({ ok: true, revogado: true });
    }
    await concluir(db, provedor, dados.idEvento, tipo, 'nada_a_revogar', iso);
    console.error(`${provedor}: estorno sem acesso ativo para revogar`, dados.idEvento);
    await avisarEstornoSemRevogacao(env, { provedor, idEvento: dados.idEvento, agora });
    return resposta({ ok: true, pendente: 'nada_a_revogar' });
  }

  const telefone = telefoneDoComprador(dados.telefone, dados.paisIso);
  if (!telefone) {
    await concluir(db, provedor, dados.idEvento, tipo, 'sem_telefone', iso);
    console.error(`${provedor}: compra sem telefone válido`, dados.idEvento);
    if (tipo === 'paid') {
      await avisarPagamentoNaoReconhecido(env, {
        provedor, idEvento: dados.idEvento, resultado: 'sem_telefone',
        produtos: dados.produtos, valorCentavos: dados.valorCentavos, agora,
      });
    }
    return resposta({ ok: true, pendente: 'sem_telefone' });
  }
  // o plano é resolvido antes de criar a conta: aviso de produto desconhecido não gera cadastro
  const plano = tipo === 'paid' ? planoDaCompra(env, dados) : null;
  if (tipo === 'paid' && !plano) {
    await concluir(db, provedor, dados.idEvento, tipo, 'plano_desconhecido', iso);
    console.error(
      `${provedor}: plano não identificado`,
      dados.idEvento,
      JSON.stringify({ produtos: dados.produtos, valorCentavos: dados.valorCentavos }),
    );
    await avisarPagamentoNaoReconhecido(env, {
      provedor, idEvento: dados.idEvento, resultado: 'plano_desconhecido',
      produtos: dados.produtos, valorCentavos: dados.valorCentavos, agora,
    });
    return resposta({ ok: true, pendente: 'plano_desconhecido' });
  }

  // aviso fora de ordem: o estorno desta compra chegou antes da aprovação, então ela não libera nada
  if (tipo === 'paid') {
    const revertida = await db.prepare(
      "SELECT 1 AS existe FROM payment_events WHERE provider = ? AND event_id = ? || ':reverted'",
    ).bind(provedor, dados.idEvento).first();
    if (revertida) {
      await concluir(db, provedor, dados.idEvento, tipo, 'ja_revertido', iso);
      return resposta({ ok: true, pendente: 'ja_revertido' });
    }
  }

  const conta = await contaDoTelefone(env, telefone, agora);
  if (!conta || conta.status !== 'active') {
    await concluir(db, provedor, dados.idEvento, tipo, 'conta_indisponivel', iso);
    if (tipo === 'paid') {
      await avisarPagamentoNaoReconhecido(env, {
        provedor, idEvento: dados.idEvento, resultado: 'conta_indisponivel',
        produtos: dados.produtos, valorCentavos: dados.valorCentavos, agora,
      });
    }
    return resposta({ ok: true, pendente: 'conta_indisponivel' });
  }

  const link = `${env.APP_BASE_URL || 'https://leviapp.org'}/ativar`;
  // acesso + serial na fila numa transação só: se falhar, nada mudou e o evento é desfeito
  const liberado = await liberarAcesso(env, conta, plano, dados.idEvento, agora, telefone, link);
  estado.acessoAlterado = true;
  await concluir(db, provedor, dados.idEvento, tipo, `liberado_${plano}`, iso);
  return resposta({ ok: true, plano, acessoAte: liberado.fim });
}
