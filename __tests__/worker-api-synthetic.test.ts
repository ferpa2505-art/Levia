import worker from '../worker/src/index';

const GEMINI_API_KEY = 'synthetic-gemini-key';
const INSTALLATION_ID = '00000000-0000-4000-8000-000000000000';
const SYNTHETIC_IMAGE_BASE64 = `/9j/${'A'.repeat(1392)}/9k=`;
const ALLOWED_ORIGIN = 'https://leviapp.org';
const SITEKEY = 'synthetic-sitekey';
const SECRET = 'synthetic-turnstile-secret';

function createKv() {
  const entries = new Map<string, string>();
  return {
    entries,
    get: jest.fn(async (key: string, type?: string) => {
      const value = entries.get(key);
      if (value === undefined) return null;
      return type === 'json' ? JSON.parse(value) : value;
    }),
    put: jest.fn(async (key: string, value: string) => { entries.set(key, value); }),
  };
}

function createEnv(overrides: Record<string, unknown> = {}) {
  return {
    GEMINI_API_KEY,
    LICENCA_TOKEN_KEY: 'synthetic-license-key',
    LEVIA_DB: {},
    TURNSTILE_SITE_KEY: SITEKEY,
    TURNSTILE_SECRET_KEY: SECRET,
    TURNSTILE_ALLOWED_HOSTNAMES: 'leviapp.org,localhost',
    LEVIA_COTAS: createKv(),
    ...overrides,
  };
}

function makeRequest(path: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  return new Request(`https://worker.test${path}`, options);
}

function makeAnalysis(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return makeRequest('/v1/analisar-prato', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function send(request: Request, env = createEnv()): Promise<Response> {
  return worker.fetch(request, env);
}

async function expectJson(response: Response, status: number, body: unknown) {
  expect(response.status).toBe(status);
  expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
  await expect(response.json()).resolves.toEqual(body);
}

let fetchMock: jest.Mock;

// Os cenários com banco de verdade (licença válida, cota, aparelhos) estão em worker-serial.test.ts.
describe('Cloudflare Worker API (synthetic, offline)', () => {
  const originalFetch = global.fetch;
  beforeEach(() => { fetchMock = jest.fn(); global.fetch = fetchMock as typeof fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  test('GET /health returns the health contract', async () => {
    await expectJson(await send(makeRequest('/health')), 200, { ok: true });
  });

  test('unknown route returns 404', async () => {
    await expectJson(await send(makeRequest('/unknown')), 404, { erro: 'nao_encontrado' });
  });

  test('GET sitekey returns only the public Turnstile key with CORS', async () => {
    const response = await send(makeRequest('/v1/turnstile/sitekey', { headers: { Origin: ALLOWED_ORIGIN } }));
    await expectJson(response, 200, { sitekey: SITEKEY });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
  });

  test('Turnstile sitekey endpoint fails closed if configuration is missing', async () => {
    await expectJson(await send(makeRequest('/v1/turnstile/sitekey'), createEnv({ TURNSTILE_SITE_KEY: undefined })), 503, { erro: 'nao_configurado' });
  });

  test('OPTIONS analysis exposes only the JSON content header', async () => {
    const response = await send(makeRequest('/v1/analisar-prato', { method: 'OPTIONS', headers: { Origin: ALLOWED_ORIGIN } }));
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    expect(response.headers.get('Vary')).toBe('Origin');
  });

  test('OPTIONS activation allows the PWA origin', async () => {
    const response = await send(makeRequest('/v1/ativar', { method: 'OPTIONS', headers: { Origin: 'https://leviapp.org' } }));
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://leviapp.org');
  });

  test('old public app token cannot authorize photo analysis', async () => {
    await expectJson(await send(makeAnalysis({
      imagem: SYNTHETIC_IMAGE_BASE64, instalacao: INSTALLATION_ID,
    }, { 'x-levia-app': 'old-public-client-token' })), 401, { erro: 'licenca_obrigatoria' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('a Turnstile token alone no longer authorizes photo analysis', async () => {
    await expectJson(await send(makeAnalysis({
      imagem: SYNTHETIC_IMAGE_BASE64, instalacao: INSTALLATION_ID, turnstileToken: 'synthetic-turnstile-token-unique',
    })), 401, { erro: 'licenca_obrigatoria' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('validates input JSON before anything else', async () => {
    await expectJson(await send(makeRequest('/v1/analisar-prato', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    })), 400, { erro: 'corpo_invalido' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('rejects an invalid installation UUID', async () => {
    await expectJson(await send(makeAnalysis({ instalacao: 'not-a-uuid', imagem: SYNTHETIC_IMAGE_BASE64, licenca: 'x' })), 400, { erro: 'instalacao_invalida' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('rejects non-JPEG or malformed base64 before upstream calls', async () => {
    await expectJson(await send(makeAnalysis({ instalacao: INSTALLATION_ID, imagem: 'A'.repeat(1200), licenca: 'x' })), 400, { erro: 'imagem_invalida' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('fails closed without the Gemini key or the licence signing key', async () => {
    const corpo = { instalacao: INSTALLATION_ID, imagem: SYNTHETIC_IMAGE_BASE64, licenca: 'x' };
    await expectJson(await send(makeAnalysis(corpo), createEnv({ GEMINI_API_KEY: undefined })), 503, { erro: 'nao_configurado' });
    await expectJson(await send(makeAnalysis(corpo), createEnv({ LICENCA_TOKEN_KEY: undefined })), 503, { erro: 'nao_configurado' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('a malformed licence is rejected before any upstream call', async () => {
    for (const licenca of ['lixo', 'v1.a.b', 'v2.a.b.c', 'v1..']) {
      await expectJson(await send(makeAnalysis({ instalacao: INSTALLATION_ID, imagem: SYNTHETIC_IMAGE_BASE64, licenca })), 403, { erro: 'licenca_invalida' });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
