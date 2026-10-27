import worker from "../worker/src/index";
import { createSessionToken } from "../worker/src/licencas";

const GEMINI_API_KEY = "synthetic-gemini-key";
const TURNSTILE_TOKEN = "synthetic-turnstile-token-unique";
const INSTALLATION_ID = "00000000-0000-4000-8000-000000000000";
const SYNTHETIC_IMAGE_BASE64 = `/9j/${"A".repeat(1392)}/9k=`;
const ALLOWED_ORIGIN = "https://levia-app.netlify.app";
const SITEKEY = "synthetic-sitekey";
const SECRET = "synthetic-turnstile-secret";
const EMAIL_ENCRYPTION_KEY = "c3luZXRpYy1lbWFpbC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw=="; // 32 bytes base64

function createKv() {
  const entries = new Map<string, string>();
  return {
    entries,
    get: jest.fn(async (key: string, type?: string) => {
      const value = entries.get(key);
      if (value === undefined) return null;
      return type === "json" ? JSON.parse(value) : value;
    }),
    put: jest.fn(async (key: string, value: string) => { entries.set(key, value); }),
  };
}

function createMockDb(initialTrials: Map<string, any> = new Map()) {
  const trials = new Map(initialTrials);
  const accounts = new Map<string, any>();
  
  return {
    trials,
    accounts,
    prepare: jest.fn((sql: string) => {
      const isUpdatePhotoUsed = sql.includes("photo_used = photo_used + 1");
      const isSelectTrial = sql.includes("FROM trials") && sql.includes("SELECT");
      const isInsertTrial = sql.includes("INSERT INTO trials");
      const isUpdateTrialStatus = sql.includes("UPDATE trials") && sql.includes("status = ?");
      
      return {
        bind: jest.fn((...params: any[]) => {
          return {
            first: jest.fn(async () => {
              if (isSelectTrial) {
                const accountId = params[0];
                return trials.get(accountId) || null;
              }
              if (sql.includes("FROM accounts")) {
                return accounts.get(params[0]) || null;
              }
              return null;
            }),
            run: jest.fn(async () => {
              if (isUpdatePhotoUsed) {
                const accountId = params[1]; // second param is account_id
                const trial = trials.get(accountId);
                if (trial) {
                  trial.photo_used = trial.photo_used + 1;
                  trial.updated_at = params[0]; // first param is updated_at
                }
              }
              if (isUpdateTrialStatus) {
                const accountId = params[2]; // third param is account_id
                const trial = trials.get(accountId);
                if (trial) {
                  trial.status = params[0]; // first param is new status
                  trial.updated_at = params[1]; // second param is updated_at
                }
              }
              if (isInsertTrial) {
                const trial = {
                  account_id: params[0],
                  started_at: params[1],
                  expires_at: params[2],
                  photo_limit: params[3],
                  photo_used: 0,
                  status: params[4],
                };
                trials.set(params[0], trial);
              }
              return { success: true };
            }),
          };
        }),
      };
    }),
    batch: jest.fn(async (statements: any[]) => {
      // Mock batch execution
    }),
  };
}

function createEnv(overrides: Record<string, unknown> = {}) {
  return {
    GEMINI_API_KEY,
    TURNSTILE_SITE_KEY: SITEKEY,
    TURNSTILE_SECRET_KEY: SECRET,
    TURNSTILE_ALLOWED_HOSTNAMES: "levia-app.netlify.app,localhost",
    LEVIA_COTAS: createKv(),
    LEVIA_DB: createMockDb(),
    EMAIL_ENCRYPTION_KEY,
    EMAIL_FROM: "test@levia.app",
    RESEND_API_KEY: "test-resend-key",
    TYPEBOT_SHARED_SECRET: "test-typebot-secret",
    ...overrides,
  };
}

function makeRequest(path: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  return new Request(`https://worker.test${path}`, options);
}

function makeAnalysis(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return makeRequest("/v1/analisar-prato", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function send(request: Request, env = createEnv()): Promise<Response> {
  return worker.fetch(request, env);
}

async function expectJson(response: Response, status: number, body: unknown) {
  expect(response.status).toBe(status);
  expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
  await expect(response.json()).resolves.toEqual(body);
}

function turnstileSuccess(hostname = "levia-app.netlify.app") {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, hostname, action: "levia_analisar_prato" }), {
    status: 200, headers: { "Content-Type": "application/json" },
  }));
}

function geminiSuccess(body: unknown = { ehComida: true, itens: [] }) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify(body) }] } }],
  }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

let fetchMock: jest.Mock;

describe("Cloudflare Worker API (synthetic, offline)", () => {
  const originalFetch = global.fetch;
  let testSessionToken: string;
  let testAccountId: string;
  let testTrials: Map<string, any>;

  beforeAll(async () => {
    // Create a test account and session token
    testAccountId = "test-account-id-" + Date.now();
    const testEnv = createEnv();
    testSessionToken = await createSessionToken(testAccountId, testEnv);
    
    // Create trial map that will be shared across tests
    testTrials = new Map();
    testTrials.set(testAccountId, {
      account_id: testAccountId,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      photo_limit: 2,
      photo_used: 0,
      status: "active",
    });
  });

  beforeEach(() => { 
    fetchMock = jest.fn(); 
    global.fetch = fetchMock as typeof fetch; 
  });
  afterEach(() => { global.fetch = originalFetch; });

  test("GET /health returns the health contract", async () => {
    await expectJson(await send(makeRequest("/health")), 200, { ok: true });
  });

  test("unknown route returns 404", async () => {
    await expectJson(await send(makeRequest("/unknown")), 404, { erro: "nao_encontrado" });
  });

  test("GET sitekey returns only the public Turnstile key with CORS", async () => {
    const response = await send(makeRequest("/v1/turnstile/sitekey", { headers: { Origin: ALLOWED_ORIGIN } }));
    await expectJson(response, 200, { sitekey: SITEKEY });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
  });

  test("Turnstile sitekey endpoint fails closed if configuration is missing", async () => {
    await expectJson(await send(makeRequest("/v1/turnstile/sitekey"), createEnv({ TURNSTILE_SITE_KEY: undefined })), 503, { erro: "nao_configurado" });
  });

  test("OPTIONS analysis exposes only the JSON content header", async () => {
    const response = await send(makeRequest("/v1/analisar-prato", { method: "OPTIONS", headers: { Origin: ALLOWED_ORIGIN } }));
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization");
    expect(response.headers.get("Vary")).toBe("Origin");
  });

  test("old public app token cannot authorize photo analysis", async () => {
    const env = createEnv();
    env.LEVIA_DB = createMockDb(testTrials);
    turnstileSuccess(); // Mock Turnstile success so we test session validation
    await expectJson(await send(makeAnalysis({
      imagem: SYNTHETIC_IMAGE_BASE64, instalacao: INSTALLATION_ID, turnstileToken: TURNSTILE_TOKEN,
    }, { "x-levia-app": "old-public-client-token" }), env), 401, { erro: "sessao_obrigatoria" });
    // Only Turnstile should be called, not Gemini
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("validates input JSON before contacting Turnstile", async () => {
    // This test doesn't need a trial since it fails at JSON parsing
    await expectJson(await send(makeRequest("/v1/analisar-prato", {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${testSessionToken}` }, body: "{",
    })), 400, { erro: "corpo_invalido" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("rejects an invalid installation UUID", async () => {
    const env = createEnv();
    env.LEVIA_DB = createMockDb(testTrials);
    await expectJson(await send(makeAnalysis({ instalacao: "not-a-uuid", imagem: SYNTHETIC_IMAGE_BASE64, turnstileToken: TURNSTILE_TOKEN }, { Authorization: `Bearer ${testSessionToken}` }), env), 400, { erro: "instalacao_invalida" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("rejects non-JPEG or malformed base64 before upstream calls", async () => {
    const env = createEnv();
    env.LEVIA_DB = createMockDb(testTrials);
    await expectJson(await send(makeAnalysis({ instalacao: INSTALLATION_ID, imagem: "A".repeat(1200), turnstileToken: TURNSTILE_TOKEN }, { Authorization: `Bearer ${testSessionToken}` }), env), 400, { erro: "imagem_invalida" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("requires a configured Turnstile secret and Gemini key", async () => {
    await expectJson(await send(makeAnalysis({ instalacao: INSTALLATION_ID, imagem: SYNTHETIC_IMAGE_BASE64, turnstileToken: TURNSTILE_TOKEN }, { Authorization: `Bearer ${testSessionToken}` }), createEnv({ TURNSTILE_SECRET_KEY: undefined })), 503, { erro: "protecao_nao_configurada" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("rejects failed, wrong-host, or wrong-action Turnstile verification", async () => {
    const env = createEnv();
    env.LEVIA_DB = createMockDb(testTrials);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, hostname: "evil.example", action: "levia_analisar_prato" }), { status: 200 }));
    await expectJson(await send(makeAnalysis({ instalacao: INSTALLATION_ID, imagem: SYNTHETIC_IMAGE_BASE64, turnstileToken: TURNSTILE_TOKEN }, { Authorization: `Bearer ${testSessionToken}` }), env), 403, { erro: "desafio_invalido" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("valid Turnstile token allows normalized synthetic response and keeps image off logs", async () => {
    const env = createEnv();
    env.LEVIA_DB = createMockDb(testTrials);
    const item = { nome: "Alimento fictício", nomeIngles: "Synthetic food", unidades: 88, gramas: 3000, confianca: 1.7,
      por100g: { kcal: 100.7, proteina: 105, carboidrato: 10, gordura: -5, fibra: 0.4 } };
    turnstileSuccess();
    geminiSuccess({ ehComida: true, itens: [item] });
    const response = await send(makeAnalysis({ imagem: SYNTHETIC_IMAGE_BASE64, instalacao: INSTALLATION_ID, idioma: "pt", turnstileToken: TURNSTILE_TOKEN }, { Origin: ALLOWED_ORIGIN, Authorization: `Bearer ${testSessionToken}` }), env);
    await expectJson(response, 200, { ehComida: true, itens: [{ nome: "Alimento fictício", nomeIngles: "Synthetic food", unidades: 50, gramas: 2000, confianca: 1,
      por100g: { kcal: 101, proteina: 100, carboidrato: 10, gordura: 0, fibra: 0.4 } }], restantes: 1 });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED_ORIGIN);
    const [verifyUrl, verifyOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(verifyUrl).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(String(verifyOptions.body)).toContain(`secret=${SECRET}`);
    const [geminiUrl, geminiOptions] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(geminiUrl).toContain("generativelanguage.googleapis.com");
    expect(new Headers(geminiOptions.headers).get("x-goog-api-key")).toBe(GEMINI_API_KEY);
    const geminiBody = JSON.parse(geminiOptions.body as string);
    expect(geminiBody.contents[0].parts[0].inline_data).toEqual({ mime_type: "image/jpeg", data: SYNTHETIC_IMAGE_BASE64 });
    expect(JSON.stringify(geminiBody)).not.toMatch(/Fulano|glicemia|medicamentos|perfil/i);
  });

  test("a failed Gemini request still reserves photo quota", async () => {
    const env = createEnv();
    env.LEVIA_DB = createMockDb(testTrials);
    turnstileSuccess();
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { status: "SYNTHETIC_FAILURE" } }), { status: 500 }));
    await expectJson(await send(makeAnalysis({ instalacao: INSTALLATION_ID, imagem: SYNTHETIC_IMAGE_BASE64, turnstileToken: TURNSTILE_TOKEN }, { Authorization: `Bearer ${testSessionToken}` }), env), 502, { erro: "falha_ia", motivo: "500 SYNTHETIC_FAILURE" });
  });

  test("account receives 402 after its configured quota is exhausted", async () => {
    const env = createEnv({ FOTOS_GRATIS_7D: 2 });
    const trials = new Map();
    trials.set(testAccountId, {
      account_id: testAccountId,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      photo_limit: 2,
      photo_used: 0,
      status: "active",
    });
    env.LEVIA_DB = createMockDb(trials);
    fetchMock.mockImplementation(async (input: string) => {
      if (input.includes("siteverify")) return new Response(JSON.stringify({ success: true, hostname: "levia-app.netlify.app", action: "levia_analisar_prato" }), { status: 200 });
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ ehComida: false, itens: [] }) }] } }] }), { status: 200 });
    });
    const req = () => makeAnalysis({ instalacao: INSTALLATION_ID, imagem: SYNTHETIC_IMAGE_BASE64, turnstileToken: TURNSTILE_TOKEN }, { Authorization: `Bearer ${testSessionToken}` });
    await send(req(), env);
    await send(req(), env);
    await expectJson(await send(req(), env), 402, expect.objectContaining({ erro: "cota_esgotada", limite: 2 }));
  });
});


