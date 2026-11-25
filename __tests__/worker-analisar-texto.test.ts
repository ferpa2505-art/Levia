import worker from '../worker/src/index';

const INSTALLATION_ID = '00000000-0000-4000-8000-000000000000';
const ALLOWED_ORIGIN = 'https://leviapp.org';

function createKv() {
  const entries = new Map<string, string>();
  return {
    get: jest.fn(async (key: string) => entries.get(key) ?? null),
    put: jest.fn(async (key: string, value: string) => { entries.set(key, value); }),
  };
}

function createEnv() {
  return {
    GEMINI_API_KEY: 'synthetic-gemini-key',
    LICENCA_TOKEN_KEY: 'synthetic-license-key',
    LEVIA_DB: {},
    TURNSTILE_SITE_KEY: 'synthetic-sitekey',
    TURNSTILE_SECRET_KEY: 'synthetic-turnstile-secret',
    TURNSTILE_ALLOWED_HOSTNAMES: 'leviapp.org,localhost',
    LEVIA_COTAS: createKv(),
  };
}

function analisarTexto(body: Record<string, unknown>) {
  return new Request('https://worker.test/v1/analisar-texto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ALLOWED_ORIGIN },
    body: JSON.stringify(body),
  });
}

describe('POST /v1/analisar-texto (offline)', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;
  beforeEach(() => { fetchMock = jest.fn(); global.fetch = fetchMock as typeof fetch; });
  afterEach(() => { global.fetch = originalFetch; });

  it('responde ao pré-voo CORS da origem permitida', async () => {
    const r = await worker.fetch(new Request('https://worker.test/v1/analisar-texto', {
      method: 'OPTIONS', headers: { Origin: ALLOWED_ORIGIN },
    }), createEnv() as never);
    expect(r.status).toBe(204);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
  });

  it('recusa texto vazio ou só espaços sem chamar o Gemini', async () => {
    for (const texto of ['', '   ', 'a', 42]) {
      const r = await worker.fetch(analisarTexto({ texto, instalacao: INSTALLATION_ID, licenca: 'x' }), createEnv() as never);
      expect(r.status).toBe(400);
      expect(await r.json()).toEqual({ erro: 'texto_invalido' });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('recusa instalação inválida sem chamar o Gemini', async () => {
    const r = await worker.fetch(analisarTexto({ texto: 'arroz e feijão', instalacao: 'nao-uuid', licenca: 'x' }), createEnv() as never);
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ erro: 'instalacao_invalida' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('recusa licença inválida sem chamar o Gemini', async () => {
    const r = await worker.fetch(analisarTexto({ texto: 'arroz e feijão', instalacao: INSTALLATION_ID, licenca: 'lixo' }), createEnv() as never);
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ erro: 'licenca_invalida' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
