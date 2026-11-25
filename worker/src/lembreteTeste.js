import { hmacHex } from './cripto';
import { normalizarTelefoneE164 } from './telefone';

/**
 * Lembrete diário por e-mail durante o teste grátis (7 dias).
 * Só para quem tem teste ativo, sem plano pago vigente, com e-mail cadastrado e que não pediu PARAR.
 * Um e-mail por dia por pessoa (o cron roda uma vez ao dia).
 */
const DIA_MS = 24 * 60 * 60 * 1000;
const LIMITE_LEADS = 5000;
const REMETENTE_PADRAO = 'Leviã <contato@leviapp.org>';
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const URL_PLANOS = 'https://www.leviapp.org/#planos';

/** Dias restantes até o fim do teste (arredondado para cima). */
export function diasRestantes(fimIso, agora) {
  const restante = new Date(fimIso).getTime() - agora;
  return Math.ceil(restante / DIA_MS);
}

/** Assunto, texto e HTML do e-mail do dia. Sem preço em reais de forma errada e sem promessa de saúde. */
export function montarEmailTeste(dias) {
  const n = Math.max(1, dias);
  const quando = n === 1 ? 'termina amanhã' : `termina em ${n} dias`;
  const assunto = n === 1
    ? 'Último dia do seu teste grátis do Leviã'
    : `Faltam ${n} dias do seu teste grátis do Leviã`;
  const beneficios = [
    'registra a refeição tirando uma foto ou falando o que comeu;',
    'acompanha calorias e macros de milhares de alimentos e produtos;',
    'mantém seus registros no seu aparelho, criptografados.',
  ];
  const texto = [
    'Olá!',
    '',
    `Seu teste grátis do Leviã ${quando}.`,
    '',
    'Não deixe o controle da sua alimentação escapar. Com o Leviã você:',
    ...beneficios.map((b) => `- ${b}`),
    '',
    'Continue sem interrupção por menos de R$ 0,67 por dia.',
    '',
    `Escolha seu plano: ${URL_PLANOS}`,
    '',
    'Estimativas. Não substitui orientação profissional.',
    '',
    'Não quer mais receber estes e-mails? Responda SAIR a esta mensagem.',
    'Leviã · contato@leviapp.org',
  ].join('\n');
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f6f4ef;font-family:Arial,sans-serif;color:#1f2a24">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;padding:28px">
<tr><td>
<p style="font-size:14px;color:#5b6b61;margin:0 0 8px">Seu teste grátis do Leviã</p>
<h1 style="font-size:24px;margin:0 0 16px">Seu teste ${quando}.</h1>
<p style="font-size:16px;line-height:1.5;margin:0 0 12px">Não deixe o controle da sua alimentação escapar. Com o Leviã você:</p>
<ul style="font-size:16px;line-height:1.6;padding-left:20px;margin:0 0 16px">${beneficios.map((b) => `<li>${b}</li>`).join('')}</ul>
<p style="font-size:16px;line-height:1.5;margin:0 0 20px"><strong>Continue sem interrupção por menos de R$ 0,67 por dia.</strong></p>
<p style="margin:0 0 24px"><a href="${URL_PLANOS}" style="background:#2f7d5b;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:bold;display:inline-block">Escolher meu plano</a></p>
<p style="font-size:12px;color:#5b6b61;line-height:1.5;margin:0">Estimativas. Não substitui orientação profissional.</p>
<p style="font-size:12px;color:#5b6b61;line-height:1.5;margin:12px 0 0">Não quer mais receber estes e-mails? Responda <strong>SAIR</strong> a esta mensagem.<br>Leviã · contato@leviapp.org</p>
</td></tr></table></td></tr></table></body></html>`;
  return { assunto, texto, html };
}

async function leadsComEmail(db) {
  const r = await db.prepare('SELECT DISTINCT phone, email FROM leads WHERE email IS NOT NULL AND email <> \'\' LIMIT ?')
    .bind(LIMITE_LEADS).all();
  return r?.results ?? [];
}

async function telefonesRecusados(db) {
  const r = await db.prepare('SELECT phone FROM wa_optout').all();
  return new Set((r?.results ?? []).map((l) => l.phone));
}

/** Envia um e-mail pelo Resend. Devolve true se aceito. */
export async function enviarEmailResend(env, para, email) {
  if (!env.RESEND_API_KEY) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM || REMETENTE_PADRAO,
      to: para,
      subject: email.assunto,
      text: email.texto,
      html: email.html,
    }),
  });
  return r.ok;
}

/** Envia o e-mail do dia para quem está no teste. Devolve contagens para o log. */
export async function enviarLembretesTeste(env, agora = Date.now(), enviar = enviarEmailResend) {
  if (!env.LEVIA_DB || !env.TYPEBOT_PHONE_HMAC_KEY || !env.RESEND_API_KEY) {
    return { enviados: 0, motivo: 'nao_configurado' };
  }
  const db = env.LEVIA_DB;
  const iso = new Date(agora).toISOString();
  const recusados = await telefonesRecusados(db);
  const leads = await leadsComEmail(db);
  let enviados = 0;

  for (const lead of leads) {
    const e164 = normalizarTelefoneE164(lead.phone);
    const para = String(lead.email).trim();
    if (!e164 || !EMAIL_VALIDO.test(para) || recusados.has(e164)) continue;
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

    const ok = await enviar(env, para, montarEmailTeste(diasRestantes(conta.fim, agora)));
    if (ok) enviados += 1;
  }
  return { enviados };
}
