/**
 * Avisos para a equipe: quando o LEVI passa uma conversa para uma pessoa (3 respostas inválidas seguidas
 * ou pedido de atendente), o dono é avisado por WhatsApp (pela fila do gateway) e por e-mail (Resend).
 *
 * O aviso leva só o necessário para agir (telefone, nome se já informado, etapa, idioma e o motivo):
 * nunca o texto das mensagens do cliente, que pode ter dado de saúde. Nada aqui pode derrubar a
 * conversa do cliente: cada canal falha sozinho e só registra no log, sem telefone.
 *
 * Configuração (wrangler.toml [vars]):
 *   ALERTA_WHATSAPP  número que recebe o aviso (ex.: "+35699506350")
 *   ALERTA_EMAILS    e-mails separados por vírgula (padrão: contatoapplevia@gmail.com)
 * E-mail: usa RESEND_API_KEY e EMAIL_FROM (um remetente de domínio verificado no Resend).
 */
const SEIS_HORAS_MS = 6 * 3600 * 1000;
const EMAIL_PADRAO = 'contatoapplevia@gmail.com';
// sem remetente próprio o Resend só entrega para o e-mail dono da conta Resend (serve para teste)
const REMETENTE_PADRAO = 'LEVI <onboarding@resend.dev>';
const EMAIL_VALIDO = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

const MOTIVOS = {
  respostas_invalidas: 'não entendeu as respostas 3 vezes seguidas',
  pediu_atendente: 'pediu para falar com uma pessoa',
};

function montarTexto({ digitos, nome, etapa, idioma, motivo }) {
  return [
    `⚠️ LEVI: o cliente +${digitos}${nome ? ` (${nome})` : ''} precisa de ajuda.`,
    `Motivo: ${MOTIVOS[motivo] ?? motivo}.`,
    `Etapa: ${etapa || 'início'} · idioma: ${idioma || '?'}.`,
    `Abrir a conversa: https://wa.me/${digitos}`,
  ].join('\n');
}

async function tentar(fn, rotulo) {
  try { return await fn(); } catch (e) { console.error(`aviso (${rotulo}):`, e?.message); return null; }
}

async function jaAvisado(env, digitos, agora) {
  if (!env.LEVIA_DB) return false;
  const linha = await tentar(() => env.LEVIA_DB.prepare(
    'SELECT 1 AS x FROM wa_outbox WHERE id LIKE ? AND criado_em > ? LIMIT 1',
  ).bind(`aviso-${digitos}-%`, agora - SEIS_HORAS_MS).first(), 'repetido');
  return !!linha;
}

/** Entra na fila do gateway; o id "aviso-…" faz o aviso sair mesmo sem conversa aberta com o destinatário. */
async function avisarPorWhatsapp(env, digitos, texto, agora) {
  const destino = String(env.ALERTA_WHATSAPP ?? '').replace(/\D/g, '');
  if (!destino || !env.LEVIA_DB) return false;
  const r = await tentar(() => env.LEVIA_DB.prepare(
    'INSERT INTO wa_outbox (id, phone, texto, enviar_em, criado_em) VALUES (?, ?, ?, ?, ?)',
  ).bind(`aviso-${digitos}-${agora}`, `+${destino}`, texto, agora, agora).run(), 'whatsapp');
  return !!r;
}

async function avisarPorEmail(env, digitos, texto) {
  if (!env.RESEND_API_KEY) return false;
  const para = String(env.ALERTA_EMAILS || EMAIL_PADRAO).split(',').map((e) => e.trim()).filter((e) => EMAIL_VALIDO.test(e));
  if (para.length === 0) return false;
  const r = await tentar(() => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM || REMETENTE_PADRAO,
      to: para,
      subject: `LEVI: cliente +${digitos} precisa de ajuda`,
      text: texto,
    }),
  }), 'email');
  if (r && !r.ok) console.error('aviso (email): resposta', r.status);
  return !!r?.ok;
}

/** Avisa a equipe (no máximo 1 vez a cada 6 h por cliente). Devolve { whatsapp, email } com o que foi enviado. */
export async function avisarEquipe(env, { telefone, nome, etapa, idioma, motivo, agora = Date.now() }) {
  const digitos = String(telefone).replace(/\D/g, '');
  if (await jaAvisado(env, digitos, agora)) return { whatsapp: false, email: false, repetido: true };
  const texto = montarTexto({ digitos, nome, etapa, idioma, motivo });
  const [whatsapp, email] = await Promise.all([
    avisarPorWhatsapp(env, digitos, texto, agora),
    avisarPorEmail(env, digitos, texto),
  ]);
  if (!whatsapp && !email) console.error('aviso: nenhum canal configurado ou todos falharam');
  return { whatsapp, email };
}

/** Pedidos de falar com uma pessoa, nos 5 idiomas do atendimento. */
const PEDIDOS = [
  'atendente', 'falar com uma pessoa', 'falar com alguem', 'falar com humano', 'pessoa de verdade', 'humano',
  'real person', 'talk to a person', 'speak to someone', 'speak to a person', 'human agent', 'human being',
  'persona real', 'hablar con una persona', 'hablar con alguien', 'agente humano',
  'operatore', 'persona vera', 'parlare con una persona', 'parlare con qualcuno',
];

export function pedeAtendente(texto) {
  const t = String(texto).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return PEDIDOS.some((p) => t.includes(p));
}
