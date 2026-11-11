import { META_PIXEL_ID } from "./config";

/**
 * Pixel da Meta (Facebook/Instagram) na página de vendas.
 * Nada é carregado antes do consentimento: sem aceite, o script da Meta nem é baixado.
 */
export type ConsentimentoPixel = "granted" | "denied" | null;
const CHAVE = "levia.pixel.consentimento";

type Fbq = ((...args: unknown[]) => void) & {
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
  callMethod?: (...args: unknown[]) => void;
};

export function pixelConfigurado() {
  return META_PIXEL_ID.length > 0;
}

export function lerConsentimento(): ConsentimentoPixel {
  try {
    const valor = localStorage.getItem(CHAVE);
    return valor === "granted" || valor === "denied" ? valor : null;
  } catch {
    return null; // navegação privada bloqueando o armazenamento
  }
}

export function definirConsentimento(valor: Exclude<ConsentimentoPixel, null>) {
  try {
    localStorage.setItem(CHAVE, valor);
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  if (valor === "granted") carregarPixel();
}

export function limparConsentimento() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* sem armazenamento */
  }
}

export function carregarPixel() {
  if (!pixelConfigurado() || typeof window === "undefined") return;
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (w.fbq) return;

  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  }) as Fbq;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  w.fbq = fbq;
  w._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView");
}

/** Chamado ao abrir a página: se o visitante já aceitou antes, o pixel volta a carregar. */
export function iniciarPixel() {
  if (lerConsentimento() === "granted") carregarPixel();
}

/** Clique no botão de assinatura: só envia se houver consentimento. Nada de dado de saúde. */
export function rastrearCheckout(plano: "mensal" | "anual", valor: number) {
  if (lerConsentimento() !== "granted") return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (!fbq) return;
  fbq("track", "InitiateCheckout", {
    content_name: `Leviã - ${plano === "anual" ? "Anual" : "Mensal"}`,
    content_category: "assinatura",
    value: valor,
    currency: "BRL",
  });
}
