/**
 * Alerta diário de entregas de pagamento presas. Roda no cron do Worker, antes da limpeza da fila
 * (retencao.js), e avisa a equipe quando:
 *   - há mensagens de compra ("pgto-…") que já venceram e não foram buscadas pelo gateway;
 *   - alguma delas está perto de ser apagada pela retenção de 14 dias;
 *   - há assinaturas pagas há mais de 24 h sem nenhum aparelho ativado (sinal de serial que não chegou,
 *     inclusive quando o gateway buscou a mensagem mas o WhatsApp não entregou).
 *
 * O alerta leva só contagens e idades: nunca telefone, nome, e-mail, serial ou texto das mensagens.
 * Sai no máximo 1 por dia. Vai por e-mail (Resend, se ALERTA_EMAILS estiver definido) e pela fila do
 * WhatsApp (ALERTA_WHATSAPP); o e-mail é o canal que importa quando o próprio gateway está parado.
 */
const MINUTO_MS = 60 * 1000;
const HORA_MS = 60 * MINUTO_MS;
const DIA_MS = 24 * HORA_MS;

export const LIMITES = {
  atrasoMin: 15, // mensagem de compra vencida há mais que isso conta como presa
  avisoAntesDaLimpezaDias: 12, // a fila apaga com 14 dias: avisa com folga de 2
  pagoSemAparelhoHoras: 24,
};

const REMETENTE_PADRAO = 'LEVI <onboarding@resend.dev>';
const EMAIL_VALIDO = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

async function tentar(fn, rotulo) {
  try { return await fn(); } catch (e) { console.error(`alerta da fila (${rotulo}):`, e?.message); return null; }
}

/** Só contagens, sem nenhum dado pessoal. */
export async function medirPagamentosPresos(env, agora = Date.now()) {
  const db = env.LEVIA_DB;
  const vazio = { presas: 0, maisAntigaHoras: 0, pertoDeApagar: 0, pagosSemAparelho: 0 };
  if (!db) return vazio;
  const fila = await tentar(() => db.prepare(
    `SELECT COUNT(*) AS presas, MIN(criado_em) AS mais_antiga,
            SUM(CASE WHEN criado_em < ?2 THEN 1 ELSE 0 END) AS perto
     FROM wa_outbox
     WHERE id LIKE 'pgto-%' AND enviado_em IS NULL AND cancelado_em IS NULL AND enviar_em <= ?1`,
  ).bind(agora - LIMITES.atrasoMin * MINUTO_MS, agora - LIMITES.avisoAntesDaLimpezaDias * DIA_MS).first(), 'fila');
  const iso = new Date(agora).toISOString();
  const corte = new Date(agora - LIMITES.pagoSemAparelhoHoras * HORA_MS).toISOString();
  const pagos = await tentar(() => db.prepare(
    `SELECT COUNT(DISTINCT e.account_id) AS n FROM entitlements e
     WHERE e.status = 'active' AND e.created_at < ?1 AND (e.current_period_end IS NULL OR e.current_period_end > ?2)
       AND NOT EXISTS (SELECT 1 FROM installations i WHERE i.account_id = e.account_id AND i.revoked_at IS NULL)`,
  ).bind(corte, iso).first(), 'pagos sem aparelho');
  const presas = Number(fila?.presas ?? 0);
  return {
    presas,
    maisAntigaHoras: presas && fila?.mais_antiga ? Math.floor((agora - Number(fila.mais_antiga)) / HORA_MS) : 0,
    pertoDeApagar: Number(fila?.perto ?? 0),
    pagosSemAparelho: Number(pagos?.n ?? 0),
  };
}

export function textoDoAlerta(m) {
  const linhas = ['⚠️ Leviã: entregas de pagamento para conferir'];
  if (m.presas) linhas.push(`Mensagens de compra presas na fila: ${m.presas} (a mais antiga há ${m.maisAntigaHoras} h).`);
  if (m.pertoDeApagar) linhas.push(`Perto de serem apagadas pela retenção de 14 dias: ${m.pertoDeApagar}.`);
  if (m.pagosSemAparelho) linhas.push(`Assinaturas pagas há mais de ${LIMITES.pagoSemAparelhoHoras} h sem nenhum aparelho ativado: ${m.pagosSemAparelho}.`);
  linhas.push('Confira se o gateway do WhatsApp está conectado. Quem não recebeu o serial pode digitar SERIAL no WhatsApp.');
  return linhas.join('\n');
}

async function enviarEmail(env, assunto, texto) {
  if (!env.RESEND_API_KEY) return false;
  const para = String(env.ALERTA_EMAILS ?? '').split(',').map((e) => e.trim()).filter((e) => EMAIL_VALIDO.test(e));
  if (para.length === 0) return false;
  const r = await tentar(() => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM || REMETENTE_PADRAO, to: para, subject: assunto, text: texto }),
  }), 'email');
  if (r && !r.ok) console.error('alerta da fila (email): resposta', r.status);
  return !!r?.ok;
}

/**
 * Mede e, se houver algo, avisa a equipe uma vez por dia (id fixo por data na fila).
 * Devolve { ...medidas, alertado, whatsapp, email, repetido? }.
 */
export async function alertarPagamentosPresos(env, agora = Date.now()) {
  const m = await medirPagamentosPresos(env, agora);
  if (!m.presas && !m.pagosSemAparelho) return { ...m, alertado: false, whatsapp: false, email: false };
  const texto = textoDoAlerta(m);
  const dia = new Date(agora).toISOString().slice(0, 10);
  const destino = String(env.ALERTA_WHATSAPP ?? '').replace(/\D/g, '');

  let whatsapp = false;
  if (destino && env.LEVIA_DB) {
    const r = await tentar(() => env.LEVIA_DB.prepare(
      'INSERT OR IGNORE INTO wa_outbox (id, phone, texto, enviar_em, criado_em) VALUES (?, ?, ?, ?, ?)',
    ).bind(`alerta-fila-${dia}`, `+${destino}`, texto, agora, agora).run(), 'whatsapp');
    if (r && r.meta?.changes !== 1) return { ...m, alertado: false, whatsapp: false, email: false, repetido: true };
    whatsapp = !!r;
  }
  const email = await enviarEmail(env, `⚠️ Leviã: ${m.presas} entrega(s) de pagamento presa(s), ${m.pagosSemAparelho} pago(s) sem aparelho`, texto);
  if (!whatsapp && !email) console.error('alerta da fila: nenhum canal configurado ou todos falharam');
  return { ...m, alertado: whatsapp || email, whatsapp, email };
}
