import worker from '../worker/src/index';

/**
 * All payloads below are fictional; Gemini and all network access are mocked.
 */

const APP_TOKEN = 'synthetic-app-token';
const GEMINI_API_KEY = 'synthetic-gemini-key';
const INSTALLATION_ID = '00000000-0000-4000-8000-000000000000';
const SYNTHETIC_IMAGE_BASE64 = `/9j/${'A'.repeat(1392)}/9k=`;
const ALLOWED_ORIGIN = 'https://levia-app.netlify.app';

function createKv() {
  const entries = new Map<string, string>();
  return {
    get: jest.fn(async (key: string, type?: string) => {
      const value = entries.get(key);
      if (value === undefined) return null;
      return type === 'json' ? JSON.parse(value) : value;
    }),
    put: jest.fn(async (key: string, value: string) => {
      entries.set(key, value);
    }),
  };
}

function createEnv(overrides: Record<string, unknown> = {}) {
  return {
    APP_TOKEN,
    GEMINI_API_KEY,
    LEVIA_COTAS: createKv(),
    ...overrides,
  };
}

function makeRequest(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {},
) {
  return new Request(`https://worker.test${path}`, options);
}

async function send(
  request: Request,
  env = createEnv(),
): Promise<Response> {
  return worker.fetch(request, env);
}

async function expectJson(response: Response, status: number, body: unknown) {
  expect(response.status).toBe(status);
  expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
  await expect(response.json()).resolves.toEqual(body);
}

describe('Cloudflare Worker API (synthetic, offline)', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('GET /health returns the health contract', async () => {
    await expectJson(await send(makeRequest('/health')), 200, { ok: true });
  });

  test('unknown route returns 404', async () => {
    await expectJson(await send(makeRequest('/unknown')), 404, { erro: 'nao_encontrado' });
  });

  test('OPTIONS analysis from the allowed web origin returns matching CORS headers', async () => {
    const response = await send(
      makeRequest('/v1/analisar-prato', {
        method: 'OPTIONS',
        headers: { Origin: ALLOWED_ORIGIN },
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, x-levia-app');
    expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    expect(response.headers.get('Vary')).toBe('Origin');
    expect(await response.text()).toBe('');
  });

  test('disallowed origin does not receive an allow-origin header', async () => {
    const response = await send(
      makeRequest('/v1/analisar-prato', {
        method: 'OPTIONS',
        headers: { Origin: 'https://synthetic-invalid-origin.test' },
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
  });

  test('analysis without the app token returns 401', async () => {
    await expectJson(
      await send(
        makeRequest('/v1/analisar-prato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }),
      ),
      401,
      { erro: 'nao_autorizado' },
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('authorized request with invalid JSON returns 400', async () => {
    await expectJson(
      await send(
        makeRequest('/v1/analisar-prato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-levia-app': APP_TOKEN },
          body: '{',
        }),
      ),
      400,
      { erro: 'corpo_invalido' },
    );
  });

  test('invalid installation UUID returns 400', async () => {
    await expectJson(
      await send(
        makeRequest('/v1/analisar-prato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-levia-app': APP_TOKEN },
          body: JSON.stringify({ instalacao: 'not-a-uuid', imagem: SYNTHETIC_IMAGE_BASE64 }),
        }),
      ),
      400,
      { erro: 'instalacao_invalida' },
    );
  });

  test('image that is too short returns 400', async () => {
    await expectJson(
      await send(
        makeRequest('/v1/analisar-prato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-levia-app': APP_TOKEN },
          body: JSON.stringify({ instalacao: INSTALLATION_ID, imagem: 'c2hvcnQ=' }),
        }),
      ),
      400,
      { erro: 'imagem_invalida' },
    );
  });

  test('missing Worker secrets returns 503', async () => {
    await expectJson(
      await send(
        makeRequest('/v1/analisar-prato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-levia-app': APP_TOKEN },
          body: '{}',
        }),
        createEnv({ GEMINI_API_KEY: undefined }),
      ),
      503,
      { erro: 'nao_configurado' },
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('authorized synthetic image returns the normalized contract and remaining quota', async () => {
    const item = {
      nome: 'Alimento fictício',
      nomeIngles: 'Synthetic food',
      unidades: 88,
      gramas: 3000,
      confianca: 1.7,
      por100g: { kcal: 100.7, proteina: 105, carboidrato: 10, gordura: -5, fibra: 0.4 },
    };
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ ehComida: true, itens: [item] }) }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const response = await send(
      makeRequest('/v1/analisar-prato', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-levia-app': APP_TOKEN,
          Origin: ALLOWED_ORIGIN,
        },
        body: JSON.stringify({
          imagem: SYNTHETIC_IMAGE_BASE64,
          instalacao: INSTALLATION_ID,
          idioma: 'pt',
        }),
      }),
    );

    await expectJson(response, 200, {
      ehComida: true,
      itens: [
        {
          nome: 'Alimento fictício',
          nomeIngles: 'Synthetic food',
          unidades: 50,
          gramas: 2000,
          confianca: 1,
          por100g: { kcal: 101, proteina: 100, carboidrato: 10, gordura: 0, fibra: 0.4 },
        },
      ],
      restantes: 1,
    });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [geminiUrl, geminiOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(geminiUrl).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
    );
    expect(geminiOptions.method).toBe('POST');
    expect(new Headers(geminiOptions.headers).get('x-goog-api-key')).toBe(GEMINI_API_KEY);
    const geminiBody = JSON.parse(geminiOptions.body as string);
    expect(geminiBody.contents[0].parts[0].inline_data).toEqual({
      mime_type: 'image/jpeg',
      data: SYNTHETIC_IMAGE_BASE64,
    });
    expect(geminiBody.contents[0].parts[1].text).toContain('nutricionista');
    expect(JSON.stringify(geminiBody)).not.toMatch(/Fulano|glicemia|medicamentos|perfil/i);
  });

  test('Gemini failure returns 502', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { status: 'SYNTHETIC_FAILURE' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expectJson(
      await send(
        makeRequest('/v1/analisar-prato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-levia-app': APP_TOKEN },
          body: JSON.stringify({ instalacao: INSTALLATION_ID, imagem: SYNTHETIC_IMAGE_BASE64 }),
        }),
      ),
      502,
      { erro: 'falha_ia', motivo: '500 SYNTHETIC_FAILURE' },
    );
  });

  test('installation is rejected with 402 after its configured free quota is exhausted', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: JSON.stringify({ ehComida: true, itens: [] }) }] } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    const env = createEnv({ FOTOS_GRATIS_7D: 2 });
    const request = () =>
      makeRequest('/v1/analisar-prato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-levia-app': APP_TOKEN },
        body: JSON.stringify({ instalacao: INSTALLATION_ID, imagem: SYNTHETIC_IMAGE_BASE64 }),
      });

    await expectJson(await send(request(), env), 200, { ehComida: false, itens: [], restantes: 1 });
    await expectJson(await send(request(), env), 200, { ehComida: false, itens: [], restantes: 0 });
    await expectJson(
      await send(request(), env),
      402,
      expect.objectContaining({ erro: 'cota_esgotada', limite: 2 }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
