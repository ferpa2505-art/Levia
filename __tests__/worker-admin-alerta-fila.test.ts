import worker from '../worker/src/index';
import { criarD1, temSqlite } from '../test-utils/d1';

/** Rota admin que dispara o alerta da fila sob demanda (prova do envio de e-mail). */
const ADMIN = 'admin-secreto';
const teste = temSqlite ? test : test.skip;
const autorizado = { Authorization: `Bearer ${ADMIN}` };

function ambiente(extra: Record<string, unknown> = {}) {
  return {
    ADMIN_TOKEN: ADMIN,
    LEVIA_DB: criarD1(),
    RESEND_API_KEY: 're_teste',
    ALERTA_EMAILS: 'dono@exemplo.com',
    ...extra,
  } as any;
}

function chamar(env: any, rota: string, init: RequestInit = {}) {
  return worker.fetch(new Request(`https://w.test${rota}`, init), env);
}

function interceptar(status = 200, ok = true) {
  const chamadas: { url: string; init: any }[] = [];
  const original = global.fetch;
  (global as unknown as { fetch: unknown }).fetch = jest.fn(async (url: string, init: any) => {
    chamadas.push({ url: String(url), init });
    return { ok, status };
  });
  return {
    chamadas,
    restaurar() { (global as unknown as { fetch: unknown }).fetch = original; },
  };
}

const postar = (env: any, rota: string, headers: Record<string, string> = autorizado) =>
  chamar(env, rota, { method: 'POST', headers: { ...headers, 'cf-connecting-ip': '10.0.0.9' } });

const fila = (env: any, id: string, criado: number) =>
  env.LEVIA_DB.sql(
    'INSERT INTO wa_outbox (id, phone, texto, enviar_em, criado_em) VALUES (?, ?, ?, ?, ?)',
    id, '+5511987654321', 'ABCD-EFGH-JKLM-NPQR', criado, criado,
  );
const envios = (env: any) => env.LEVIA_DB.sql('SELECT * FROM alerta_envios') as any[];
const naFila = (env: any) => env.LEVIA_DB.sql("SELECT id FROM wa_outbox WHERE id LIKE 'alerta-fila-%'") as any[];

afterEach(() => jest.restoreAllMocks());

describe('rota admin do alerta da fila: acesso', () => {
  test('sem ADMIN_TOKEN a rota responde nao_configurado', async () => {
    const env = ambiente({ ADMIN_TOKEN: undefined });
    const r = await postar(env, '/v1/admin/alerta-fila?teste=1');
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ erro: 'nao_configurado' });
  });

  teste('sem token e com token errado responde 401 sem vazar o segredo', async () => {
    const env = ambiente();
    const semToken = await postar(env, '/v1/admin/alerta-fila?teste=1', {});
    expect(semToken.status).toBe(401);
    const errado = await postar(env, '/v1/admin/alerta-fila?teste=1', { Authorization: 'Bearer chute' });
    expect(errado.status).toBe(401);
    expect(JSON.stringify(await errado.json())).not.toContain(ADMIN);
    expect(envios(env)).toHaveLength(0);
  });
});

describe('rota admin do alerta da fila: prova do envio', () => {
  teste('teste=1 envia o e-mail marcado como TESTE e registra o 200 do Resend', async () => {
    const env = ambiente();
    fila(env, 'pgto-1', Date.now() - 2 * 3600 * 1000);
    const rede = interceptar(200, true);
    let r: Response;
    try {
      r = await postar(env, '/v1/admin/alerta-fila?teste=1');
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(200);
    expect(await r!.json()).toMatchObject({ ok: true, teste: true, email: true, emailStatus: 200, presas: 1 });

    expect(rede.chamadas).toHaveLength(1);
    expect(rede.chamadas[0].url).toBe('https://api.resend.com/emails');
    const corpo = JSON.parse(rede.chamadas[0].init.body);
    expect(corpo.subject).toContain('[TESTE]');
    expect(corpo.to).toEqual(['dono@exemplo.com']);
    expect(corpo.text).not.toContain('11987654321');

    const [linha] = envios(env);
    expect(linha.id).toContain('-teste-');
    expect(linha).toMatchObject({ presas: 1, houve_alerta: 1, whatsapp: 0, email: 1, email_status: 200, email_erro: null });
    // modo teste não enfileira WhatsApp nem consome o alerta do dia
    expect(naFila(env)).toHaveLength(0);
  });

  teste('recusa do Resend vira 502 com o status registrado', async () => {
    const env = ambiente();
    fila(env, 'pgto-1', Date.now() - 2 * 3600 * 1000);
    const rede = interceptar(403, false);
    let r: Response;
    try {
      r = await postar(env, '/v1/admin/alerta-fila?teste=1');
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(502);
    expect(await r!.json()).toMatchObject({ ok: false, email: false, emailStatus: 403, emailErro: 'http_403' });
    expect(envios(env)[0]).toMatchObject({ email: 0, email_status: 403, email_erro: 'http_403' });
  });

  teste('sem RESEND_API_KEY o motivo fica claro no registro', async () => {
    const env = ambiente({ RESEND_API_KEY: undefined });
    fila(env, 'pgto-1', Date.now() - 2 * 3600 * 1000);
    const r = await postar(env, '/v1/admin/alerta-fila?teste=1');
    expect(r.status).toBe(502);
    expect(envios(env)[0]).toMatchObject({ email: 0, email_erro: 'sem_resend_api_key' });
  });

  teste('sem teste=1 roda o alerta real: com nada preso, registra o dia sem enviar', async () => {
    const env = ambiente();
    const rede = interceptar(200, true);
    let r: Response;
    try {
      r = await postar(env, '/v1/admin/alerta-fila');
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(200);
    expect(await r!.json()).toMatchObject({ ok: false, alertado: false, presas: 0, pagosSemAparelho: 0 });
    expect(rede.chamadas).toHaveLength(0);
    expect(envios(env)[0]).toMatchObject({ houve_alerta: 0, email: 0 });
  });

  teste('a chamada fica na auditoria administrativa', async () => {
    const env = ambiente();
    fila(env, 'pgto-1', Date.now() - 2 * 3600 * 1000);
    const rede = interceptar(200, true);
    try {
      await postar(env, '/v1/admin/alerta-fila?teste=1');
    } finally {
      rede.restaurar();
    }
    const linha = env.LEVIA_DB.sql("SELECT * FROM admin_auditoria WHERE rota = '/v1/admin/alerta-fila'") as any[];
    expect(linha).toHaveLength(1);
    expect(linha[0]).toMatchObject({ metodo: 'POST', ip: '10.0.0.9', status: 200, motivo: 'ok', detalhe: 'teste' });
    expect(JSON.stringify(linha[0])).not.toContain(ADMIN);
  });
});
