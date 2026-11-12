import { base64url, base64urlParaTexto, hmacHex, iguais, sha256 } from './cripto';
import { reservarEscopos } from './cotas';

/**
 * Acesso por serial: a pessoa conversa no WhatsApp, recebe um serial, ativa no app e o
 * Worker devolve uma licença assinada, presa àquela instalação. Só a licença abre a IA.
 * O serial nunca é guardado em texto: só o hash em activation_codes.
 */
const UM_DIA_MS = 24 * 3600 * 1000;
const UMA_HORA_MS = 3600 * 1000;
const TESTE_DIAS = 7;
const LICENCA_DIAS = 365; // quem revoga é o banco (conta/aparelho), não o vencimento do token
// sem I, O, 0, 1 (confundem na digitação); 32 símbolos = 5 bits cada, 16 símbolos = 80 bits
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SERIAL = /^[A-HJ-NP-Z2-9]{16}$/;
const LINK_DO_EMAIL = /^[A-Za-z0-9_-]{43}$/; // código do fluxo do Typebot (/v1/teste/iniciar)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resposta(corpo, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function gerarSerial() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => ALFABETO[b & 31]).join('');
}

export function formatarSerial(serial) {
  return serial.match(/.{4}/g).join('-');
}

/** Aceita o serial com ou sem hífen/espaço/minúsculas, ou o código longo do e-mail. */
export function normalizarCodigo(valor) {
  if (typeof valor !== 'string') return null;
  const bruto = valor.trim();
  if (bruto.length === 0 || bruto.length > 64) return null;
  if (LINK_DO_EMAIL.test(bruto)) return bruto;
  const limpo = bruto.toUpperCase().replace(/[\s-]/g, '');
  return SERIAL.test(limpo) ? limpo : null;
}

export async function contaDoTelefone(env, telefone, agora) {
  const telefoneHash = await hmacHex(env.TYPEBOT_PHONE_HMAC_KEY, telefone);
  const buscar = () => env.LEVIA_DB.prepare('SELECT id, status FROM accounts WHERE phone_hash = ?').bind(telefoneHash).first();
  let conta = await buscar();
  if (!conta) {
    const iso = new Date(agora).toISOString();
    // accounts exige e-mail; no WhatsApp a identidade é o telefone, então o "e-mail" é uma marca derivada dele
    const marca = await hmacHex(env.EMAIL_HASH_KEY, `whatsapp:${telefone}`);
    await env.LEVIA_DB.prepare(
      'INSERT OR IGNORE INTO accounts (id, email_hash, phone_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), marca, telefoneHash, iso, iso).run();
    conta = await buscar();
  }
  return conta;
}

/**
 * Emite um serial novo para o telefone (E.164) e invalida os anteriores. Os aparelhos já
 * ativados continuam valendo: a licença deles não depende do serial.
 * Devolve { ok:true, serial } ou { ok:false, motivo: 'nao_configurado' | 'bloqueada' | 'limite' }.
 */
export async function emitirSerial(env, { telefone, agora = Date.now() }) {
  if (!env.LEVIA_DB || !env.TYPEBOT_PHONE_HMAC_KEY || !env.EMAIL_HASH_KEY) return { ok: false, motivo: 'nao_configurado' };
  const conta = await contaDoTelefone(env, telefone, agora);
  if (!conta || conta.status !== 'active') return { ok: false, motivo: 'bloqueada' };

  const limite = await reservarEscopos(env, [
    { nome: 'emissao', chave: `serial-emissao:${conta.id}`, limite: 3, janelaMs: UM_DIA_MS },
  ], agora);
  if (!limite.ok) return { ok: false, motivo: 'limite' };

  const serial = gerarSerial();
  const iso = new Date(agora).toISOString();
  const validade = Number(env.SERIAL_VALIDADE_DIAS || 30);
  const expira = new Date(agora + validade * UM_DIA_MS).toISOString();
  await env.LEVIA_DB.batch([
    env.LEVIA_DB.prepare('UPDATE activation_codes SET invalidated_at = ? WHERE account_id = ? AND invalidated_at IS NULL').bind(iso, conta.id),
    env.LEVIA_DB.prepare(
      'INSERT INTO activation_codes (id, account_id, code_hash, issued_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), conta.id, await sha256(serial), iso, expira),
  ]);
  return { ok: true, serial: formatarSerial(serial) };
}

/**
 * Direito de exclusão: apaga a conta do telefone. Teste, aparelhos, códigos e assinaturas caem junto
 * (ON DELETE CASCADE); o serial e as licenças já emitidas deixam de valer na hora.
 */
export async function apagarContaPorTelefone(env, telefone) {
  if (!env.LEVIA_DB || !env.TYPEBOT_PHONE_HMAC_KEY) return false;
  const telefoneHash = await hmacHex(env.TYPEBOT_PHONE_HMAC_KEY, telefone);
  await env.LEVIA_DB.prepare('DELETE FROM accounts WHERE phone_hash = ?').bind(telefoneHash).run();
  return true;
}

/**
 * O que a conta pode usar agora: assinatura ativa, ou o teste de 7 dias. Quando houver os dois,
 * vale a assinatura. Devolve { plano, limite, janelaMs, fim } ou null (sem acesso).
 */
export async function acessoDaConta(env, contaId, agora) {
  const iso = new Date(agora).toISOString();
  const assinatura = await env.LEVIA_DB.prepare(
    `SELECT photo_limit, current_period_end FROM entitlements
     WHERE account_id = ? AND status IN ('active', 'trialing') AND (current_period_end IS NULL OR current_period_end > ?)
     ORDER BY COALESCE(current_period_end, '9999') DESC LIMIT 1`,
  ).bind(contaId, iso).first();
  if (assinatura) {
    const limite = Number(assinatura.photo_limit) > 0 ? Number(assinatura.photo_limit) : Number(env.FOTOS_ASSINANTE_30D || 100);
    return { plano: 'assinatura', limite, janelaMs: 30 * UM_DIA_MS, fim: assinatura.current_period_end };
  }
  const teste = await env.LEVIA_DB.prepare(
    "SELECT photo_limit, expires_at FROM trials WHERE account_id = ? AND status = 'active' AND expires_at > ?",
  ).bind(contaId, iso).first();
  if (teste) return { plano: 'teste', limite: Number(teste.photo_limit), janelaMs: 7 * UM_DIA_MS, fim: teste.expires_at };
  return null;
}

async function assinarLicenca(env, contaId, instalacao, agora) {
  const dados = { c: contaId, i: instalacao, e: Math.floor(agora / 1000) + LICENCA_DIAS * 24 * 3600 };
  const corpo = `v1.${base64url(new TextEncoder().encode(JSON.stringify(dados)))}`;
  return `${corpo}.${await hmacHex(env.LICENCA_TOKEN_KEY, corpo)}`;
}

/** POST /v1/ativar { serial, instalacao } → { ok, licenca, plano, acessoAte } */
export async function ativarSerial(request, env, agora = Date.now()) {
  if (!env.LEVIA_DB || !env.LICENCA_TOKEN_KEY) return resposta({ erro: 'nao_configurado' }, 503);
  if (Number(request.headers.get('content-length') ?? 0) > 2000) return resposta({ erro: 'corpo_invalido' }, 413);
  let corpo;
  try { corpo = await request.json(); } catch { return resposta({ erro: 'corpo_invalido' }, 400); }
  const instalacao = corpo?.instalacao;
  if (typeof instalacao !== 'string' || !UUID.test(instalacao)) return resposta({ erro: 'instalacao_invalida' }, 400);

  // Antes de olhar o serial: errar também gasta tentativa, então não dá para adivinhar no chute.
  const ip = request.headers.get('cf-connecting-ip') ?? 'sem-ip';
  const tentativas = await reservarEscopos(env, [
    { nome: 'ip', chave: `ativar:ip:${ip}`, limite: 15, janelaMs: UMA_HORA_MS },
    { nome: 'inst', chave: `ativar:inst:${instalacao}`, limite: 10, janelaMs: UMA_HORA_MS },
  ], agora);
  if (!tentativas.ok) return resposta({ erro: 'muitas_tentativas' }, 429);

  const codigo = normalizarCodigo(corpo?.serial);
  if (!codigo) return resposta({ erro: 'serial_invalido' }, 403);

  const db = env.LEVIA_DB;
  const iso = new Date(agora).toISOString();
  // A leitura inicial identifica o código; somente as guardas no batch autorizam escritas.
  const linha = await db.prepare(
    `SELECT c.id AS codigo_id, c.account_id AS conta_id, a.status AS conta_status,
            c.entitlement_id AS direito_id, e.status AS direito_status, e.current_period_end AS direito_fim
     FROM activation_codes c
     JOIN accounts a ON a.id = c.account_id
     LEFT JOIN entitlements e ON e.id = c.entitlement_id AND e.account_id = c.account_id
     WHERE c.code_hash = ? AND c.invalidated_at IS NULL AND c.expires_at > ?`,
  ).bind(await sha256(codigo), iso).first();
  if (!linha || linha.conta_status !== 'active') return resposta({ erro: 'serial_invalido' }, 403);

  const existente = await db.prepare('SELECT account_id, revoked_at FROM installations WHERE id = ?').bind(instalacao).first();
  if (existente && existente.account_id !== linha.conta_id) return resposta({ erro: 'instalacao_em_uso' }, 409);
  if (existente?.revoked_at) return resposta({ erro: 'aparelho_revogado' }, 403);

  // O batch é o ponto de decisão da ativação. Cada escrita revalida a autorização.
  const validadeCodigo = `
    c.id = ? AND c.account_id = ? AND c.code_hash = ?
    AND c.invalidated_at IS NULL AND c.expires_at > ?
    AND a.id = c.account_id AND a.status = 'active'
    AND (
      c.entitlement_id IS NULL
      OR EXISTS (
        SELECT 1 FROM entitlements e
        WHERE e.id = c.entitlement_id AND e.account_id = c.account_id
          AND e.status IN ('active', 'trialing')
          AND (e.current_period_end IS NULL OR e.current_period_end > ?)
      )
    )
    AND (
      c.entitlement_id IS NOT NULL
      OR EXISTS (
        SELECT 1 FROM entitlements s
        WHERE s.account_id = c.account_id
          AND s.status IN ('active', 'trialing')
          AND (s.current_period_end IS NULL OR s.current_period_end > ?)
      )
      OR EXISTS (
        SELECT 1 FROM trials t
        WHERE t.account_id = c.account_id AND t.status = 'active' AND t.expires_at > ?
      )
      OR NOT EXISTS (SELECT 1 FROM trials t WHERE t.account_id = c.account_id)
    )`;
  const argumentos = [linha.codigo_id, linha.conta_id, await sha256(codigo), iso, iso, iso, iso];
  const comandos = [];
  if (existente) {
    comandos.push(db.prepare(
      `UPDATE installations SET last_seen_at = ?
       WHERE id = ? AND account_id = ? AND revoked_at IS NULL
         AND EXISTS (
           SELECT 1 FROM activation_codes c JOIN accounts a ON a.id = c.account_id
           WHERE ${validadeCodigo}
         )`,
    ).bind(iso, instalacao, linha.conta_id, ...argumentos));
  } else {
    comandos.push(db.prepare(
      `INSERT INTO installations (id, account_id, first_seen_at, last_seen_at)
       SELECT ?, c.account_id, ?, ?
       FROM activation_codes c JOIN accounts a ON a.id = c.account_id
       WHERE ${validadeCodigo}
         AND NOT EXISTS (SELECT 1 FROM installations i WHERE i.id = ?)
         AND (SELECT COUNT(*) FROM installations i WHERE i.account_id = c.account_id AND i.revoked_at IS NULL) < ?`,
    ).bind(instalacao, iso, iso, ...argumentos, instalacao, Number(env.MAX_DISPOSITIVOS || 2)));
  }
  const fimTeste = new Date(agora + TESTE_DIAS * UM_DIA_MS).toISOString();
  comandos.push(db.prepare(
    `INSERT OR IGNORE INTO trials (account_id, started_at, expires_at, photo_limit, created_at, updated_at)
     SELECT c.account_id, ?, ?, ?, ?, ?
     FROM activation_codes c JOIN accounts a ON a.id = c.account_id
     WHERE ${validadeCodigo}
       AND c.entitlement_id IS NULL
       AND NOT EXISTS (SELECT 1 FROM trials t WHERE t.account_id = c.account_id)
       AND EXISTS (SELECT 1 FROM installations i WHERE i.id = ? AND i.account_id = c.account_id AND i.revoked_at IS NULL)`,
  ).bind(iso, fimTeste, Number(env.FOTOS_GRATIS_7D || 2), iso, iso, ...argumentos, instalacao));
  comandos.push(db.prepare(
    `UPDATE activation_codes SET used_at = COALESCE(used_at, ?)
     WHERE id = ?
       AND EXISTS (
         SELECT 1 FROM activation_codes c JOIN accounts a ON a.id = c.account_id
         WHERE ${validadeCodigo}
           AND EXISTS (SELECT 1 FROM installations i WHERE i.id = ? AND i.account_id = c.account_id AND i.revoked_at IS NULL)
       )`,
  ).bind(iso, linha.codigo_id, ...argumentos, instalacao));
  const resultados = await db.batch(comandos);
  const mutacaoInstalacao = Number(resultados?.[0]?.meta?.changes ?? 0) === 1;
  if (!mutacaoInstalacao) {
    // Releitura serve só para classificar a recusa, nunca para autorizar outra escrita.
    const atual = await db.prepare(
      `SELECT c.invalidated_at, c.expires_at, a.status AS conta_status,
              c.entitlement_id AS direito_id, e.status AS direito_status, e.current_period_end AS direito_fim
       FROM activation_codes c JOIN accounts a ON a.id = c.account_id
       LEFT JOIN entitlements e ON e.id = c.entitlement_id AND e.account_id = c.account_id
       WHERE c.id = ?`,
    ).bind(linha.codigo_id).first();
    if (!atual || atual.invalidated_at || !(atual.expires_at > iso) || atual.conta_status !== 'active') return resposta({ erro: 'serial_invalido' }, 403);
    if (atual.direito_id && (atual.direito_status === null || !['active', 'trialing'].includes(atual.direito_status) || (atual.direito_fim && !(atual.direito_fim > iso)))) {
      return resposta({ erro: 'serial_invalido' }, 403);
    }
    const atualInstalacao = await db.prepare('SELECT account_id, revoked_at FROM installations WHERE id = ?').bind(instalacao).first();
    if (atualInstalacao?.revoked_at) return resposta({ erro: 'aparelho_revogado' }, 403);
    if (atualInstalacao && atualInstalacao.account_id !== linha.conta_id) return resposta({ erro: 'instalacao_em_uso' }, 409);
    const acessoAtual = await acessoDaConta(env, linha.conta_id, agora);
    if (!acessoAtual) {
      const trial = await db.prepare('SELECT account_id FROM trials WHERE account_id = ?').bind(linha.conta_id).first();
      if (trial) return resposta({ erro: 'acesso_expirado' }, 402);
    }
    return resposta({ erro: 'limite_dispositivos' }, 409);
  }

  const acesso = await acessoDaConta(env, linha.conta_id, agora);
  if (!acesso) return resposta({ erro: 'acesso_expirado' }, 402);
  return resposta({
    ok: true,
    licenca: await assinarLicenca(env, linha.conta_id, instalacao, agora),
    plano: acesso.plano,
    acessoAte: acesso.fim,
    fotos: acesso.limite,
  });
}

/**
 * Confere a licença que o app manda a cada análise: assinatura, aparelho e conta no banco,
 * e acesso vigente. Devolve { ok:true, conta:{id,limite,janelaMs}, plano, fim } ou { ok:false, status, corpo }.
 */
export async function validarLicenca(env, licenca, instalacao, agora = Date.now()) {
  const falha = (status, erro) => ({ ok: false, status, corpo: { erro } });
  if (!env.LEVIA_DB || !env.LICENCA_TOKEN_KEY) return falha(503, 'nao_configurado');
  if (typeof licenca !== 'string' || licenca.length === 0) return falha(401, 'licenca_obrigatoria');
  const partes = licenca.length <= 600 ? licenca.split('.') : [];
  if (partes.length !== 3 || partes[0] !== 'v1') return falha(403, 'licenca_invalida');
  const esperado = await hmacHex(env.LICENCA_TOKEN_KEY, `${partes[0]}.${partes[1]}`);
  if (!iguais(partes[2], esperado)) return falha(403, 'licenca_invalida');

  let dados;
  try { dados = JSON.parse(base64urlParaTexto(partes[1])); } catch { return falha(403, 'licenca_invalida'); }
  if (typeof dados?.c !== 'string' || dados.i !== instalacao || !(Number(dados.e) * 1000 > agora)) {
    return falha(403, 'licenca_invalida');
  }
  const linha = await env.LEVIA_DB.prepare(
    `SELECT a.status AS conta_status, i.revoked_at AS revogado
     FROM installations i JOIN accounts a ON a.id = i.account_id
     WHERE i.id = ? AND i.account_id = ?`,
  ).bind(instalacao, dados.c).first();
  if (!linha || linha.conta_status !== 'active' || linha.revogado) return falha(403, 'licenca_revogada');
  const acesso = await acessoDaConta(env, dados.c, agora);
  if (!acesso) return falha(402, 'acesso_expirado');
  return { ok: true, conta: { id: dados.c, limite: acesso.limite, janelaMs: acesso.janelaMs }, plano: acesso.plano, fim: acesso.fim };
}
