import { Platform } from 'react-native';

const WORKER = 'https://levia-ia-worker.ferpa2505.workers.dev';
const SCRIPT_ID = 'levia-turnstile-script';

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

async function carregarScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') throw new Error('turnstile_indisponivel');
  if (window.turnstile) return;
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existente = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      const script = existente ?? document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('turnstile_indisponivel'));
      if (!existente) document.head.appendChild(script);
    }).catch((erro) => {
      scriptPromise = null;
      throw erro;
    });
  }
  await scriptPromise;
  if (!window.turnstile) throw new Error('turnstile_indisponivel');
}

async function obterSitekey(): Promise<string> {
  const response = await fetch(`${WORKER}/v1/turnstile/sitekey`, { method: 'GET', cache: 'no-store' });
  if (!response.ok) throw new Error('turnstile_nao_configurado');
  const data = await response.json() as { sitekey?: string };
  if (typeof data.sitekey !== 'string' || !data.sitekey) throw new Error('turnstile_nao_configurado');
  return data.sitekey;
}

/** Mostra o desafio interativo; o token é curto, de uso único e validado no Worker. */
export async function obterTurnstileToken(): Promise<string> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') throw new Error('turnstile_web_only');
  const [sitekey] = await Promise.all([obterSitekey(), carregarScript()]);
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '2147483647', background: 'rgba(0,0,0,.58)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  });
  const panel = document.createElement('div');
  Object.assign(panel.style, {
    width: 'min(100%, 420px)', padding: '24px', borderRadius: '18px', background: '#FBF6EC',
    color: '#2E3A35', font: '16px/1.45 system-ui, sans-serif', boxShadow: '0 18px 60px rgba(0,0,0,.28)',
  });
  const title = document.createElement('div');
  title.textContent = 'Confirme que você é uma pessoa';
  Object.assign(title.style, { fontWeight: '700', fontSize: '19px', marginBottom: '8px' });
  const description = document.createElement('div');
  description.textContent = 'Essa verificação protege o serviço de análise de fotos contra abuso.';
  Object.assign(description.style, { marginBottom: '18px' });
  const widget = document.createElement('div');
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancelar';
  Object.assign(cancel.style, { marginTop: '16px', border: '0', background: 'transparent', color: '#3E5A3B', padding: '8px 0', font: 'inherit', cursor: 'pointer' });
  panel.append(title, description, widget, cancel);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  return new Promise((resolve, reject) => {
    let widgetId: string | null = null;
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      overlay.remove();
    };
    cancel.onclick = () => { cleanup(); reject(new Error('turnstile_cancelado')); };
    try {
      widgetId = window.turnstile!.render(widget, {
        sitekey,
        action: 'levia_analisar_prato',
        callback: (token: string) => { cleanup(); resolve(token); },
        'error-callback': () => { cleanup(); reject(new Error('turnstile_indisponivel')); },
        'expired-callback': () => { cleanup(); reject(new Error('turnstile_expirado')); },
        'timeout-callback': () => { cleanup(); reject(new Error('turnstile_expirado')); },
      });
    } catch (erro) {
      cleanup();
      reject(erro);
    }
  });
}
