import { hmacHex } from './cripto';
import { normalizarTelefoneE164 } from './telefone';

/**
 * Lembrete diário durante o teste grátis (7 dias).
 * Só para quem tem teste ativo, sem plano pago vigente e que não pediu PARAR.
 * Entra na fila do gateway do WhatsApp (wa_outbox), uma mensagem por dia por pessoa.
 */
const DIA_MS = 24 * 60 * 60 * 1000;
const LIMITE_LEADS = 5000;
export const URL_PLANOS = 'https://www.leviapp.org/#planos';

/** Texto do lembrete. Dias restantes arredondados para cima (no último dia, "1 dia"). */
export function montarTextoLembrete(diasRestantes) {
  const dias = Math.max(1, diasRestantes);
  const quando = dias === 1 ? 'termina amanhã' : `termina em ${dias} dias`;
  return (
    `Olá! Seu teste grátis do Leviã ${quando}. ` +
    `Para continuar sem interrupção, escolha seu plano: ${URL_PLANOS}\n\n` +
    'Para não receber mais estes avisos, responda PARAR.'
  );
}

/** Dias restantes até o fim do teste (arredondado para cima). */
export function diasRestantes(fimIso, agora) {
  const restante = new Date(fimIso).getTime() - agora;
  return Math.ceil(restante / DIA_MS);
}

async function telefonesComLead(db) {
  const r = await db.prepare('SELECT DISTINCT phone FROM leads LIMIT ?').bind(LIMITE_LEADS).all();
  return (r?.results ?? []).map((l) => l.phone).filter(Boolean);
}

async function telefonesRecusados(db) {
  const r = await db.prepare('SELECT phone FROM wa_optout').all();
  return new Set((r?.results ?? []).map((l) => l.phone));
}

/** Envia (enfileira) o lembrete do dia para quem está no teste. Devolve contagens para o log. */
export async function enviarLembretesTeste(env, agora = Date.now()) {
  if (!env.LEVIA_DB || !env.TYPEBOT_PHONE_HMAC_KEY) return { enfileirados: 0, motivo: 'nao_configurado' };
  const db = env.LEVIA_DB;
  const hoje = new Date(agora).toISOString().slice(0, 10);
  const iso = new Date(agora).toISOString();
  const recusados = await telefonesRecusados(db);
  const telefones = await telefonesComLead(db);
  let enfileirados = 0;

  for (const bruto of telefones) {
    const e164 = normalizarTelefoneE164(bruto);
    if (!e164 || recusados.has(e164)) continue;
    const hash = await hmacHex(env.TYPEBOT_PHONE_HMAC_KEY, e164);
    const conta = await db.prepare(
      `SELECT a.id AS conta_id, t.expires_at AS fim
         FROM accounts a
         JOIN trials t ON t.account_id = a.id
        WHERE a.phone_hash = ? AND a.status = 'active'
          AND t.status = 'active' AND t.expires_at > ?
          AND NOT EXISTS (
            SELECT 1 FROM entitlements e
             WHERE e.account_id = a.id AND e.status = 'active'
               AND (e.current_period_end IS NULL OR e.current_period_end > ?))`,
    ).bind(hash, iso, iso).first();
    if (!conta) continue;

    const dias = diasRestantes(conta.fim, agora);
    const r = await db.prepare(
      'INSERT OR IGNORE INTO wa_outbox (id, phone, texto, enviar_em, criado_em) VALUES (?, ?, ?, ?, ?)',
    ).bind(`teste-${hash.slice(0, 16)}-${hoje}`, e164, montarTextoLembrete(dias), agora, agora).run();
    if (r?.meta?.changes) enfileirados += 1;
  }
  return { enfileirados };
}
