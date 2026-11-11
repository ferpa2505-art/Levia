import { Platform } from 'react-native';

const WORKER = process.env.EXPO_PUBLIC_WORKER_URL || 'https://levia-ia-worker.ferpa2505.workers.dev';
const SCRIPT_ID = 'levia-turnstile-script';

type BrowserNode = {
  id: string;
  src: string;
  type: string;
  async: boolean;
  defer: boolean;
  textContent: string | null;
  style: Record<string, string>;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  onclick: (() => void) | null;
  append: (...nodes: BrowserNode[]) => void;
  appendChild: (node: BrowserNode) => void;
  remove: () => void;
};

type TurnstileApi = {
  render: (container: BrowserNode, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

type BrowserDocument = {
  head: BrowserNode;
  body: BrowserNode;
  getElementById: (id: string) => BrowserNode | null;
  createElement: (tag: string) => BrowserNode;
};

type BrowserWindow = { turnstile?: TurnstileApi };
const browser = globalThis as unknown as { window?: BrowserWindow; document?: BrowserDocument };

let scriptPromise: Promise<void> | null = null;

async function carregarScript(): Promise<void> {
  const win = browser.window;
  const doc = browser.document;
  if (!win || !doc) throw new Error('turnstile_indisponivel');
  if (win.turnstile) return;
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const existente = doc.getElementById(SCRIPT_ID);
      const script = existente ?? doc.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('turnstile_indisponivel'));
      if (!existente) doc.head.appendChild(script);
    }).catch((erro) => {
      scriptPromise = null;
      throw erro;
    });
  }
  await scriptPromise;
  if (!browser.window?.turnstile) throw new Error('turnstile_indisponivel');
}

async function obterSitekey(): Promise<string> {
  const response = await fetch(`${WORKER}/v1/turnstile/sitekey`, { method: 'GET' });
  if (!response.ok) throw new Error('turnstile_nao_configurado');
  const data = await response.json() as { sitekey?: string };
  if (typeof data.sitekey !== 'string' || !data.sitekey) throw new Error('turnstile_nao_configurado');
  return data.sitekey;
}

/** Mostra o desafio interativo; o token é curto, de uso único e validado no Worker. */
export async function obterTurnstileToken(): Promise<string> {
  const doc = browser.document;
  const win = browser.window;
  if (Platform.OS !== 'web' || !doc || !win) throw new Error('turnstile_web_only');
  const [sitekey] = await Promise.all([obterSitekey(), carregarScript()]);
  const overlay = doc.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '2147483647', background: 'rgba(0,0,0,.58)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  });
  const panel = doc.createElement('div');
  Object.assign(panel.style, {
    width: 'min(100%, 420px)', padding: '24px', borderRadius: '18px', background: '#FBF6EC',
    color: '#2E3A35', font: '16px/1.45 system-ui, sans-serif', boxShadow: '0 18px 60px rgba(0,0,0,.28)',
  });
  const title = doc.createElement('div');
  title.textContent = 'Confirme que você é uma pessoa';
  Object.assign(title.style, { fontWeight: '700', fontSize: '19px', marginBottom: '8px' });
  const description = doc.createElement('div');
  description.textContent = 'Essa verificação protege o serviço de análise de fotos contra abuso.';
  Object.assign(description.style, { marginBottom: '18px' });
  const widget = doc.createElement('div');
  const cancel = doc.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancelar';
  Object.assign(cancel.style, { marginTop: '16px', border: '0', background: 'transparent', color: '#3E5A3B', padding: '8px 0', font: 'inherit', cursor: 'pointer' });
  panel.append(title, description, widget, cancel);
  overlay.appendChild(panel);
  doc.body.appendChild(overlay);

  return new Promise<string>((resolve, reject) => {
    let widgetId: string | null = null;
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      if (widgetId && browser.window?.turnstile) browser.window.turnstile.remove(widgetId);
      overlay.remove();
    };
    cancel.onclick = () => { cleanup(); reject(new Error('turnstile_cancelado')); };
    try {
      widgetId = win.turnstile!.render(widget, {
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
