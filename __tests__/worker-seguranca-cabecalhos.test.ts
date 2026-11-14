import worker from '../worker/src/index';

/** Cabeçalhos de segurança: precisam sair em toda resposta, inclusive erro e preflight. */
const ESPERADOS = {
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

const chamar = (rota: string, init: RequestInit = {}, env: any = {}) =>
  worker.fetch(new Request(`https://w.test${rota}`, init), env);

/** Confere valor a valor: um header faltando ou com valor diferente reprova. */
const conferir = (r: Response) => {
  for (const [nome, valor] of Object.entries(ESPERADOS)) {
    expect(r.headers.get(nome)).toBe(valor);
  }
};

describe('cabeçalhos de segurança em toda resposta', () => {
  test('/health sai com todos os cabeçalhos', async () => {
    const r = await chamar('/health');
    expect(r.status).toBe(200);
    conferir(r);
  });

  test('rota inexistente (404) também sai com eles', async () => {
    const r = await chamar('/rota-que-nao-existe');
    expect(r.status).toBe(404);
    conferir(r);
  });

  test('erro de rota administrativa mantém os cabeçalhos', async () => {
    const r = await chamar('/v1/admin/alerta-fila', { method: 'POST' });
    expect(r.status).toBe(503);
    conferir(r);
  });

  test('preflight CORS ganha os cabeçalhos sem perder o CORS', async () => {
    const r = await chamar('/v1/ativar', { method: 'OPTIONS', headers: { Origin: 'https://leviapp.org' } });
    expect(r.headers.get('access-control-allow-origin')).toBe('https://leviapp.org');
    expect(r.headers.get('access-control-allow-methods')).toContain('POST');
    conferir(r);
  });

  test('origem desconhecida fica sem CORS, mas com os cabeçalhos', async () => {
    const r = await chamar('/v1/ativar', { method: 'OPTIONS', headers: { Origin: 'https://malicioso.test' } });
    expect(r.headers.get('access-control-allow-origin')).toBeNull();
    conferir(r);
  });

  test('a resposta continua sendo JSON com no-store', async () => {
    const r = await chamar('/health');
    expect(r.headers.get('content-type')).toContain('application/json');
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(await r.json()).toMatchObject({ ok: true });
  });

  test('o cron continua exportado', () => {
    expect(typeof (worker as unknown as { scheduled?: unknown }).scheduled).toBe('function');
  });
});
