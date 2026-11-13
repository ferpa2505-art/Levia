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

/**
 * Tenta o e-mail e devolve { ok, status, erro } para ficar registrado no banco: sem isso, um
 * envio aceito não deixava rastro nenhum e a única prova era o painel do Resend.
 */
async function enviarEmail(env, assunto, texto) {
  if (!env.RESEND_API_KEY) return { ok: false, status: null, erro: 'sem_resend_api_key' };
  const para = String(env.ALERTA_EMAILS ?? '').split(',').map((e) => e.trim()).filter((e) => EMAIL_VALIDO.test(e));
  if (para.length === 0) return { ok: false, status: null, erro: 'sem_alerta_emails' };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM || REMETENTE_PADRAO, to: para, subject: assunto, text: texto }),
    });
    if (!r.ok) {
      console.error('alerta da fila (email): resposta', r.status);
      return { ok: false, status: r.status, erro: `http_${r.status}` };
    }
    return { ok: true, status: r.status, erro: null };
  } catch (e) {
    console.error('alerta da fila (email):', e?.message);
    return { ok: false, status: null, erro: String(e?.message ?? 'falha').slice(0, 200) };
  }
}

/**
 * Grava (ou atualiza) a linha do dia em alerta_envios. Roda também quando nada está preso: é a
 * prova de que o cron executou. Falha no registro nunca derruba o alerta.
 */
async function registrarExecucao(env, dados) {
  if (!env.LEVIA_DB) return false;
  const { m, agora, id, dia, houveAlerta, whatsapp, email } = dados;
  const r = await tentar(() => env.LEVIA_DB.prepare(
    `INSERT INTO alerta_envios
       (id, dia, presas, perto_de_apagar, pagos_sem_aparelho, houve_alerta, whatsapp, email, email_status, email_erro, criado_em, atualizado_em)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)
     ON CONFLICT(id) DO UPDATE SET
       presas = excluded.presas,
       perto_de_apagar = excluded.perto_de_apagar,
       pagos_sem_aparelho = excluded.pagos_sem_aparelho,
       houve_alerta = excluded.houve_alerta,
       whatsapp = excluded.whatsapp,
       email = excluded.email,
       email_status = excluded.email_status,
       email_erro = excluded.email_erro,
       atualizado_em = excluded.atualizado_em`,
  ).bind(
    id, dia, m.presas, m.pertoDeApagar, m.pagosSemAparelho,
    houveAlerta ? 1 : 0, whatsapp ? 1 : 0, email.ok ? 1 : 0,
    email.status ?? null, email.erro ?? null, agora,
  ).run(), 'registro do envio');
  return !!r;
}

/**
 * Envia só o e-mail, marcado como teste, sem tocar na fila do WhatsApp nem no limite de 1 por dia.
 * É o que a rota admin usa para provar o canal na hora, sem esperar o cron nem o painel do Resend.
 * Fica registrado em alerta_envios com id próprio (…-teste-HHMMSS), então não falseia o dia.
 */
export async function provarEnvioDoAlerta(env, agora = Date.now()) {
  const m = await medirPagamentosPresos(env, agora);
  const dia = new Date(agora).toISOString().slice(0, 10);
  const marca = new Date(agora).toISOString().slice(11, 19).replace(/:/g, '');
  const texto = `[TESTE] ${textoDoAlerta(m)}`;
  const assunto = `[TESTE] ⚠️ Leviã: ${m.presas} entrega(s) presa(s), ${m.pagosSemAparelho} pago(s) sem aparelho`;
  const email = await enviarEmail(env, assunto, texto);
  const registrado = await registrarExecucao(env, {
    m, agora, id: `alerta-fila-${dia}-teste-${marca}`, dia, houveAlerta: true, whatsapp: false, email,
  });
  return {
    ...m,
    teste: true,
    email: email.ok,
    emailStatus: email.status ?? null,
    emailErro: email.erro ?? null,
    registrado,
  };
}

/**
 * Mede e, se houver algo, avisa a equipe uma vez por dia (id fixo por data na fila).
 * Devolve { ...medidas, alertado, whatsapp, email, repetido? }.
 */
export async function alertarPagamentosPresos(env, agora = Date.now()) {
  const m = await medirPagamentosPresos(env, agora);
  const dia = new Date(agora).toISOString().slice(0, 10);
  const id = `alerta-fila-${dia}`;
  const semEmail = { ok: false, status: null, erro: null };

  if (!m.presas && !m.pagosSemAparelho) {
    // nada preso: grava a execução do dia e fica quieto (silêncio ≠ cron quebrado)
    const registrado = await registrarExecucao(env, { m, agora, id, dia, houveAlerta: false, whatsapp: false, email: semEmail });
    return { ...m, alertado: false, whatsapp: false, email: false, registrado };
  }

  const texto = textoDoAlerta(m);
  const destino = String(env.ALERTA_WHATSAPP ?? '').replace(/\D/g, '');

  let whatsapp = false;
  if (destino && env.LEVIA_DB) {
    const r = await tentar(() => env.LEVIA_DB.prepare(
      'INSERT OR IGNORE INTO wa_outbox (id, phone, texto, enviar_em, criado_em) VALUES (?, ?, ?, ?, ?)',
    ).bind(id, `+${destino}`, texto, agora, agora).run(), 'whatsapp');
    // já avisado hoje: a linha do dia em alerta_envios é a do primeiro envio, não se reescreve
    if (r && r.meta?.changes !== 1) return { ...m, alertado: false, whatsapp: false, email: false, repetido: true };
    whatsapp = !!r;
  }
  const resultadoEmail = await enviarEmail(env, `⚠️ Leviã: ${m.presas} entrega(s) de pagamento presa(s), ${m.pagosSemAparelho} pago(s) sem aparelho`, texto);
  const registrado = await registrarExecucao(env, { m, agora, id, dia, houveAlerta: true, whatsapp, email: resultadoEmail });
  if (!whatsapp && !resultadoEmail.ok) console.error('alerta da fila: nenhum canal configurado ou todos falharam');
  return {
    ...m,
    alertado: whatsapp || resultadoEmail.ok,
    whatsapp,
    email: resultadoEmail.ok,
    emailStatus: resultadoEmail.status ?? null,
    emailErro: resultadoEmail.erro ?? null,
    registrado,
  };
}
