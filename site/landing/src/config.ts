/**
 * ============================================================
 *  LINKS DO SITE — preencha aqui (um único lugar).
 *  Valores entre colchetes [ ... ] são tratados como "pendentes":
 *  o botão aparece, mas indica "em breve" e não leva a lugar quebrado.
 * ============================================================
 */

/** Link do bot LEVI no WhatsApp (formato https://wa.me/55DDDNUMERO).
 *  Hoje usa o número que já estava no site antigo — CONFIRMAR se é o número do bot. */
export const LINK_WHATSAPP_DO_BOT = "https://wa.me/5516996034777";

/** Checkouts Hotmart (produtos aprovados: 8875689 Mensal e 8876081 Anual). Links simples; o modo popup (?checkoutMode=2) exige o widget da Hotmart. */
export const LINK_CHECKOUT_MENSAL = "https://pay.hotmart.com/M108322229J";
export const LINK_CHECKOUT_ANUAL = "https://pay.hotmart.com/T108322944O";

/** Endereço de ativação do serial (ajustar se o app for para app.leviapp.org). */
export const LINK_ATIVAR = "https://leviapp.org/ativar";
export const LINK_ATIVAR_LABEL = "leviapp.org/ativar";

export const LINK_PRIVACIDADE = "https://ferpa2505-art.github.io/levia-policies/privacidade.html";
/** Termos de Serviço publicados no próprio app (rota /termos do leviapp.org). */
export const LINK_TERMOS = "https://leviapp.org/termos";
export const EMAIL_CONTATO = "contato@leviapp.org";

export const YOUTUBE_ID = "AtZ6cEqgnMc";

export const isPending = (url: string) => !url || url.trim().startsWith("[");

export const whatsappWithText = (text: string) => {
  if (isPending(LINK_WHATSAPP_DO_BOT)) return "#contato";
  const sep = LINK_WHATSAPP_DO_BOT.includes("?") ? "&" : "?";
  return `${LINK_WHATSAPP_DO_BOT}${sep}text=${encodeURIComponent(text)}`;
};

export const TRIAL_MESSAGE = "Olá, LEVI! Quero começar meu teste grátis de 7 dias do Leviã.";
export const WHATSAPP_TRIAL = whatsappWithText(TRIAL_MESSAGE);
