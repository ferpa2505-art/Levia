import { iguais, sha256 } from './cripto';
import { contaDoTelefone, formatarSerial, gerarSerial } from './serial';

/**
 * Pagamento pela PAYT: a PAYT avisa (postback) que a compra foi paga e o Worker libera o acesso
 * de 30 dias (mensal) ou 365 dias (anual) na conta do telefone do comprador, gera um serial novo
 * e o entrega pelo WhatsApp. Quem já usa o teste não precisa reativar: o acesso pago vale na hora
 * para os aparelhos já ativados. Estorno e chargeback revogam o acesso daquela compra.
 *
 * O formato do postback da PAYT não está em documentação pública, por isso a leitura dos campos é
 * tolerante (JSON ou formulário, campos aninhados ou planos). Confirme com o "testar URL" da PAYT.
 */
const UM_DIA_MS = 24 * 3600 * 1000;
const PLANOS = { monthly: { dias: 30, rotulo: 'mensal' }, annual: { dias: 365, rotulo: 'anual' } };
const PAGO = new Set(['finished', 'paid', 'approved', 'completed', 'complete', 'confirmed', 'paga', 'pago', 'aprovado', 'aprovada', 'concluido']);
const REVERTIDO = new Set(['refunded', 'refund', 'chargeback', 'charged_back', 'canceled', 'cancelled', 'reembolsado', 'estornado', 'cancelado']);

export function resposta(corpo, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

const texto = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');
const normalizar = (v) => texto(v).toLowerCase().replace(/[\s-]+/g, '_');
const lista = (v) => texto(v).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

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

function primeiro(...valores) {
  for (const v of valores) if (texto(v)) return texto(v);
  return '';
}

/** Telefone do comprador em E.164 (+55…): sem DDI, assume Brasil. */
export function telefoneDoComprador(bruto) {
  let digitos = texto(bruto).replace(/\D/g, '').replace(/^0+/, '');
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  return digitos.length >= 12 && digitos.length <= 15 ? `+${digitos}` : null;
}

function extrair(corpo) {
  const cliente = corpo.customer ?? corpo.client ?? corpo.buyer ?? {};
  const produto = corpo.product ?? corpo.produto ?? {};
  const transacao = corpo.transaction ?? corpo.sale ?? {};
  return {
    chave: primeiro(corpo.integration_key, corpo.integrationKey, corpo.key),
    status: normalizar(primeiro(corpo.status, transacao.status, corpo.transaction_status)),
    idEvento: primeiro(corpo.transaction_id, transacao.id, transacao.transaction_id, corpo.id, corpo.order_id, corpo.cart_id),
    telefone: primeiro(cliente.phone, cliente.cellphone, cliente.mobile, cliente.telephone, corpo.phone, corpo.customer_phone),
    produtos: [produto.code, produto.id, produto.sku, produto.name, produto.codigo, corpo.product_code, corpo.product_id]
      .map((v) => texto(v).toLowerCase()).filter(Boolean),
    valorCentavos: Math.round(Number(String(primeiro(transacao.total_price, transacao.amount, corpo.total_price, corpo.amount, corpo.price)).replace(',', '.')) * 100) || 0,
    plano: normalizar(primeiro(corpo.plan, corpo.plano)),
  };
}

/** Mensal ou anual: pelo código do produto configurado, ou pelo valor pago como último recurso. */
function planoDaCompra(env, dados) {
  const mensais = lista(env.PAYT_PRODUTOS_MENSAL);
  const anuais = lista(env.PAYT_PRODUTOS_ANUAL);
  if (dados.produtos.some((p) => anuais.includes(p))) return 'annual';
  if (dados.produtos.some((p) => mensais.includes(p))) return 'monthly';
  const mensal = Number(env.PAYT_VALOR_MENSAL_CENTAVOS || 1997);
  const anual = Number(env.PAYT_VALOR_ANUAL_CENTAVOS || 19171);
  if (dados.valorCentavos === anual) return 'annual';
  if (dados.valorCentavos === mensal) return 'monthly';
  return null;
}

// a chave do evento é compra + tipo: o pagamento e o estorno da mesma compra são avisos diferentes
async function registrarEvento(db, provedor, idEvento, tipo, hash, iso) {
  const r = await db.prepare(
    `INSERT OR IGNORE INTO payment_events (provider, event_id, event_type, payload_hash, signature_valid, created_at)
     VALUES (?5, ?1 || ':' || ?2, ?2, ?3, 1, ?4)`,
  ).bind(idEvento, tipo, hash, iso, provedor).run();
  return r?.meta?.changes === 1;
}

const concluir = (db, provedor, idEvento, tipo, resultado, iso) => db.prepare(
  "UPDATE payment_events SET processed_at = ?, processing_result = ? WHERE provider = ? AND event_id = ? || ':' || ?",
).bind(iso, resultado, provedor, idEvento, tipo).run();

async function liberarAcesso(env, conta, plano, idEvento, agora) {
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
  await db.batch([
    db.prepare(
      `INSERT INTO entitlements (id, account_id, plan, status, photo_limit, current_period_start, current_period_end, last_payment_id, created_at, updated_at)
       VALUES (?1, ?2, ?3, 'active', ?4, ?5, ?6, ?7, ?8, ?8)`,
    ).bind(direitoId, conta.id, plano, Number(env.FOTOS_ASSINANTE_30D || 100), new Date(inicio).toISOString(), fim, idEvento, iso),
    db.prepare('UPDATE activation_codes SET invalidated_at = ? WHERE account_id = ? AND invalidated_at IS NULL').bind(iso, conta.id),
    db.prepare(
      'INSERT INTO activation_codes (id, account_id, entitlement_id, code_hash, issued_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), conta.id, direitoId, await sha256(serial), iso, fim),
  ]);
  return { serial: formatarSerial(serial), fim, rotulo };
}

function mensagemDeLiberacao({ serial, fim, rotulo }, link) {
  const ate = new Date(fim).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return `Pagamento confirmado! 🎉 Seu plano ${rotulo} do Leviã está liberado até ${ate}.\n\n` +
    `Se você já usa o app, ele já está liberado, não precisa fazer nada. Se for ativar agora, abra ${link}, toque em "Ativar" e cole o serial que vou enviar na próxima mensagem 👇`;
}

async function avisarNoWhatsApp(env, telefone, mensagens, agora) {
  for (const msg of mensagens) {
    await env.LEVIA_DB.prepare(
      'INSERT INTO wa_outbox (id, phone, texto, enviar_em, criado_em) VALUES (?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), telefone, msg, agora, agora).run();
  }
}

/**
 * Núcleo comum aos provedores de pagamento (PAYT, Hotmart). `tipo` = 'paid' | 'reverted';
 * `dados` = { idEvento, telefone, produtos, valorCentavos }. O aviso repetido é ignorado e
 * telefone ausente ou plano desconhecido ficam registrados em payment_events para conferência.
 */
export async function processarPagamento(env, provedor, tipo, dados, corpo, agora = Date.now()) {
  const db = env.LEVIA_DB;
  const iso = new Date(agora).toISOString();
  const hash = await sha256(JSON.stringify(corpo));
  // o provedor reenvia o mesmo aviso: só o primeiro de cada compra e tipo é processado
  if (!(await registrarEvento(db, provedor, dados.idEvento, tipo, hash, iso))) return resposta({ ok: true, duplicado: true });

  const telefone = telefoneDoComprador(dados.telefone);
  if (!telefone) {
    await concluir(db, provedor, dados.idEvento, tipo, 'sem_telefone', iso);
    console.error(`${provedor}: compra sem telefone válido`, dados.idEvento);
    return resposta({ ok: true, pendente: 'sem_telefone' });
  }
  const conta = await contaDoTelefone(env, telefone, agora);
  if (!conta || conta.status !== 'active') {
    await concluir(db, provedor, dados.idEvento, tipo, 'conta_indisponivel', iso);
    return resposta({ ok: true, pendente: 'conta_indisponivel' });
  }

  if (tipo === 'reverted') {
    await db.batch([
      db.prepare(
        "UPDATE entitlements SET status = 'revoked', updated_at = ?1 WHERE account_id = ?2 AND last_payment_id = ?3 AND status = 'active'",
      ).bind(iso, conta.id, dados.idEvento),
      db.prepare(
        `UPDATE activation_codes SET invalidated_at = ?1 WHERE invalidated_at IS NULL
         AND entitlement_id IN (SELECT id FROM entitlements WHERE account_id = ?2 AND last_payment_id = ?3)`,
      ).bind(iso, conta.id, dados.idEvento),
    ]);
    await concluir(db, provedor, dados.idEvento, tipo, 'revogado', iso);
    return resposta({ ok: true, revogado: true });
  }

  const plano = planoDaCompra(env, dados);
  if (!plano) {
    await concluir(db, provedor, dados.idEvento, tipo, 'plano_desconhecido', iso);
    console.error(`${provedor}: plano não identificado`, dados.idEvento, dados.produtos, dados.valorCentavos);
    return resposta({ ok: true, pendente: 'plano_desconhecido' });
  }

  const liberado = await liberarAcesso(env, conta, plano, dados.idEvento, agora);
  const link = `${env.APP_BASE_URL || 'https://leviapp.org'}/ativar`;
  try {
    await avisarNoWhatsApp(env, telefone, [mensagemDeLiberacao(liberado, link), liberado.serial], agora);
  } catch (e) {
    console.error(`${provedor}: aviso no WhatsApp falhou`, e?.message); // o acesso já está liberado
  }
  await concluir(db, provedor, dados.idEvento, tipo, `liberado_${plano}`, iso);
  return resposta({ ok: true, plano, acessoAte: liberado.fim });
}

/** POST /v1/payt/webhook — a PAYT chama quando a compra muda de status. */
export async function receberPostbackPayt(request, env, agora = Date.now()) {
  if (!env.LEVIA_DB || !env.PAYT_INTEGRATION_KEY || !env.TYPEBOT_PHONE_HMAC_KEY || !env.EMAIL_HASH_KEY) {
    return resposta({ erro: 'nao_configurado' }, 503);
  }
  const corpo = await lerCorpo(request);
  if (!corpo || typeof corpo !== 'object') return resposta({ erro: 'corpo_invalido' }, 400);
  const dados = extrair(corpo);

  // a "Chave Única" da PAYT vem no corpo; também aceitamos em ?chave= para quem a coloca na URL
  const chave = dados.chave || new URL(request.url).searchParams.get('chave') || '';
  if (!iguais(chave, env.PAYT_INTEGRATION_KEY)) return resposta({ erro: 'nao_autorizado' }, 401);
  if (!dados.idEvento) return resposta({ erro: 'sem_id_da_compra' }, 400);

  const tipo = PAGO.has(dados.status) ? 'paid' : REVERTIDO.has(dados.status) ? 'reverted' : null;
  if (!tipo) return resposta({ ok: true, ignorado: dados.status || 'sem_status' }); // aguardando pagamento etc.
  return processarPagamento(env, 'payt', tipo, dados, corpo, agora);
}
