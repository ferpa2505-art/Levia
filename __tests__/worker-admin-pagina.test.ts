import worker from '../worker/src/index';
import { criarD1, temSqlite } from '../test-utils/d1';

const ADMIN = 'admin-secreto';
const TOKEN_PAGINA = 'token-da-pagina';

function ambiente(extra: Record<string, unknown> = {}) {
  return { ADMIN_TOKEN: ADMIN, FB_PAGE_ID: '1234567890', FB_PAGE_TOKEN: TOKEN_PAGINA, ...extra } as any;
}

function chamar(env: any, rota: string, init: RequestInit = {}) {
  return worker.fetch(new Request(`https://w.test${rota}`, init), env);
}

function interceptar(corpo: unknown, status = 200, ok = true) {
  const chamadas: { url: string; init: any }[] = [];
  const original = global.fetch;
  (global as unknown as { fetch: unknown }).fetch = jest.fn(async (url: string, init: any) => {
    chamadas.push({ url: String(url), init });
    return { ok, status, json: async () => corpo };
  });
  return {
    chamadas,
    restaurar() { (global as unknown as { fetch: unknown }).fetch = original; },
  };
}

const autorizado = { Authorization: `Bearer ${ADMIN}` };

afterEach(() => jest.restoreAllMocks());

describe('rotas administrativas da Página', () => {
  test('sem ADMIN_TOKEN configurado a rota fica fechada', async () => {
    const r = await chamar(ambiente({ ADMIN_TOKEN: undefined }), '/v1/admin/pagina/post', {
      method: 'POST', headers: autorizado, body: JSON.stringify({ mensagem: 'oi' }),
    });
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ erro: 'nao_configurado' });
  });

  test('token administrativo errado ou ausente é recusado', async () => {
    expect((await chamar(ambiente(), '/v1/admin/pagina/post', {
      method: 'POST', body: JSON.stringify({ mensagem: 'oi' }),
    })).status).toBe(401);
    expect((await chamar(ambiente(), '/v1/admin/pagina/post', {
      method: 'POST', headers: { Authorization: 'Bearer errado' }, body: JSON.stringify({ mensagem: 'oi' }),
    })).status).toBe(401);
    expect((await chamar(ambiente(), '/v1/admin/pagina/insights')).status).toBe(401);
  });

  test('publica usando o token de Página e devolve o id do post', async () => {
    const rede = interceptar({ id: '1234567890_42' });
    let r: Response;
    try {
      r = await chamar(ambiente(), '/v1/admin/pagina/post', {
        method: 'POST', headers: autorizado,
        body: JSON.stringify({ mensagem: 'Olá da Leviã', link: 'https://leviapp.org' }),
      });
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(200);
    expect(await r!.json()).toEqual({ ok: true, id: '1234567890_42' });
    const { url, init } = rede.chamadas[0];
    expect(new URL(url).pathname).toBe('/v27.0/1234567890/feed');
    // o token administrativo nunca vai para a Meta; só o token da Página
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN_PAGINA}`);
    expect(JSON.stringify(init)).not.toContain(ADMIN);
    expect(new URLSearchParams(init.body.toString()).get('message')).toBe('Olá da Leviã');
  });

  test('post sem mensagem devolve 400 sem chamar a Meta', async () => {
    const rede = interceptar({ id: 'x' });
    let r: Response;
    try {
      r = await chamar(ambiente(), '/v1/admin/pagina/post', {
        method: 'POST', headers: autorizado, body: JSON.stringify({ link: 'https://leviapp.org' }),
      });
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(400);
    expect((await r!.json()).erro).toBe('parametro_invalido');
    expect(rede.chamadas).toHaveLength(0);
  });

  test('token da Página vencido devolve 502 identificando o problema', async () => {
    const rede = interceptar({
      error: { message: 'Error validating access token', type: 'OAuthException', code: 190, error_subcode: 463 },
    }, 400, false);
    let r: Response;
    try {
      r = await chamar(ambiente(), '/v1/admin/pagina/post', {
        method: 'POST', headers: autorizado, body: JSON.stringify({ mensagem: 'oi' }),
      });
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(502);
    expect(await r!.json()).toEqual({ erro: 'token_pagina_invalido', codigo: 190, subcodigo: 463 });
  });

  test('lê insights com métricas e período informados', async () => {
    const rede = interceptar({ data: [{ name: 'page_media_view', values: [] }] });
    let r: Response;
    try {
      r = await chamar(ambiente(), '/v1/admin/pagina/insights?metric=page_media_view&period=week', { headers: autorizado });
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(200);
    const corpo = await r!.json();
    expect(corpo.ok).toBe(true);
    expect(corpo.dados).toHaveLength(1);
    const params = new URL(rede.chamadas[0].url).searchParams;
    expect(params.get('metric')).toBe('page_media_view');
    expect(params.get('period')).toBe('week');
  });

  test('período inválido é recusado antes da Meta', async () => {
    const rede = interceptar({ data: [] });
    let r: Response;
    try {
      r = await chamar(ambiente(), '/v1/admin/pagina/insights?period=hour', { headers: autorizado });
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(400);
    expect((await r!.json()).erro).toBe('periodo_invalido');
    expect(rede.chamadas).toHaveLength(0);
  });
});

function kvFalso() {
  const dados = new Map<string, string>();
  return {
    dados,
    async get(chave: string) { return dados.get(chave) ?? null; },
    async put(chave: string, valor: string) { dados.set(chave, String(valor)); },
  };
}

const envComKv = (kv: any, extra: Record<string, unknown> = {}) => ambiente({ LEVIA_COTAS: kv, ...extra });

function postar(env: any, ip: string, token = ADMIN) {
  return chamar(env, '/v1/admin/pagina/post', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'cf-connecting-ip': ip },
    body: JSON.stringify({ mensagem: 'oi' }),
  });
}

describe('limite de tentativas no ADMIN_TOKEN', () => {
  test('10 falhas no mesmo IP bloqueiam a próxima tentativa, mesmo com o token certo', async () => {
    const kv = kvFalso();
    const env = envComKv(kv);
    for (let i = 0; i < 10; i++) {
      expect((await postar(env, '1.2.3.4', 'errado')).status).toBe(401);
    }
    const bloqueada = await postar(env, '1.2.3.4');
    expect(bloqueada.status).toBe(429);
    expect(await bloqueada.json()).toEqual({ erro: 'muitas_tentativas' });
    expect(Number(bloqueada.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  test('o bloqueio é por IP: outro endereço continua atendido', async () => {
    const kv = kvFalso();
    const env = envComKv(kv);
    for (let i = 0; i < 10; i++) await postar(env, '9.9.9.9', 'errado');
    expect((await postar(env, '9.9.9.9', 'errado')).status).toBe(429);

    const rede = interceptar({ id: '1234567890_7' });
    let r: Response;
    try {
      r = await postar(env, '8.8.8.8');
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(200);
  });

  test('chamadas autenticadas não gastam tentativas', async () => {
    const kv = kvFalso();
    const env = envComKv(kv);
    const rede = interceptar({ id: '1234567890_8' });
    try {
      for (let i = 0; i < 3; i++) expect((await postar(env, '7.7.7.7')).status).toBe(200);
    } finally {
      rede.restaurar();
    }
    expect(kv.dados.size).toBe(0);
  });

  test('o bloqueio vale só para a janela de 15 minutos', async () => {
    const base = 1_700_000_000_000;
    const espia = jest.spyOn(Date, 'now').mockReturnValue(base);
    const kv = kvFalso();
    const env = envComKv(kv);
    try {
      for (let i = 0; i < 10; i++) await postar(env, '6.6.6.6', 'errado');
      expect((await postar(env, '6.6.6.6')).status).toBe(429);

      espia.mockReturnValue(base + 15 * 60 * 1000);
      const rede = interceptar({ id: '1234567890_9' });
      try {
        expect((await postar(env, '6.6.6.6')).status).toBe(200);
      } finally {
        rede.restaurar();
      }
    } finally {
      espia.mockRestore();
    }
  });

  test('sem KV disponível o token continua sendo exigido', async () => {
    const env = ambiente();
    for (let i = 0; i < 11; i++) {
      expect((await postar(env, '5.5.5.5', 'errado')).status).toBe(401);
    }
    const rede = interceptar({ id: '1234567890_10' });
    let r: Response;
    try {
      r = await postar(env, '5.5.5.5');
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(200);
  });
});

function logsAdmin(espia: jest.SpyInstance) {
  return espia.mock.calls
    .filter((chamada: unknown[]) => chamada[0] === 'admin_auditoria')
    .map((chamada: unknown[]) => JSON.parse(String(chamada[1])));
}

async function capturarLogs(acao: () => Promise<unknown>) {
  const espia = jest.spyOn(console, 'log').mockImplementation(() => {});
  try { await acao(); } catch (e) { espia.mockRestore(); throw e; }
  // mockRestore() limpa mock.calls: leia antes de restaurar
  const linhas = logsAdmin(espia);
  espia.mockRestore();
  return linhas;
}

describe('auditoria das rotas administrativas', () => {
  test('registra rota, método, IP, status e motivo sem o token recusado', async () => {
    const linhas = await capturarLogs(() => postar(ambiente(), '4.4.4.4', 'token-errado'));
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({
      rota: '/v1/admin/pagina/post', metodo: 'POST', ip: '4.4.4.4', status: 401, motivo: 'nao_autorizado',
    });
    expect(JSON.stringify(linhas[0])).not.toContain('token-errado');
  });

  test('publicação bem-sucedida audita ok e o id, sem o texto publicado', async () => {
    const rede = interceptar({ id: '1234567890_77' });
    let linhas: any[];
    try {
      linhas = await capturarLogs(() => chamar(ambiente(), '/v1/admin/pagina/post', {
        method: 'POST',
        headers: { ...autorizado, 'cf-connecting-ip': '3.3.3.3' },
        body: JSON.stringify({ mensagem: 'Conteúdo sensível do post' }),
      }));
    } finally {
      rede.restaurar();
    }
    expect(linhas![0]).toMatchObject({ status: 200, motivo: 'ok', detalhe: '1234567890_77', ip: '3.3.3.3' });
    const registro = JSON.stringify(linhas![0]);
    expect(registro).not.toContain('Conteúdo sensível do post');
    expect(registro).not.toContain(TOKEN_PAGINA);
    expect(registro).not.toContain(ADMIN);
  });

  test('bloqueio por tentativas também é auditado', async () => {
    const env = envComKv(kvFalso());
    const linhas = await capturarLogs(async () => {
      for (let i = 0; i < 10; i++) await postar(env, '2.2.2.2', 'errado');
      await postar(env, '2.2.2.2');
    });
    expect(linhas).toHaveLength(11);
    expect(linhas[10]).toMatchObject({ status: 429, motivo: 'muitas_tentativas', ip: '2.2.2.2' });
  });

  test('token da Página vencido audita o motivo com o subcódigo', async () => {
    const rede = interceptar({
      error: { message: 'Error validating access token', type: 'OAuthException', code: 190, error_subcode: 463 },
    }, 400, false);
    let linhas: any[];
    try {
      linhas = await capturarLogs(() => chamar(ambiente(), '/v1/admin/pagina/post', {
        method: 'POST',
        headers: { ...autorizado, 'cf-connecting-ip': '1.1.1.1' },
        body: JSON.stringify({ mensagem: 'oi' }),
      }));
    } finally {
      rede.restaurar();
    }
    expect(linhas![0]).toMatchObject({ status: 502, motivo: 'token_pagina_invalido', detalhe: '463' });
    expect(JSON.stringify(linhas![0])).not.toContain(TOKEN_PAGINA);
  });
});

const testeD1 = temSqlite ? test : test.skip;

describe('auditoria persistida no D1', () => {
  testeD1('grava a publicação bem-sucedida sem texto nem tokens', async () => {
    const db = criarD1();
    const env = ambiente({ LEVIA_DB: db });
    const rede = interceptar({ id: '1234567890_55' });
    let r: Response;
    try {
      r = await chamar(env, '/v1/admin/pagina/post', {
        method: 'POST',
        headers: { ...autorizado, 'cf-connecting-ip': '10.0.0.1' },
        body: JSON.stringify({ mensagem: 'Segredo do post' }),
      });
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(200);
    const linha = await db.prepare('SELECT * FROM admin_auditoria').first();
    expect(linha).toMatchObject({
      rota: '/v1/admin/pagina/post', metodo: 'POST', ip: '10.0.0.1', status: 200, motivo: 'ok', detalhe: '1234567890_55',
    });
    expect(Number(linha!.criado_em)).toBeGreaterThan(0);
    const bruto = JSON.stringify(linha);
    expect(bruto).not.toContain('Segredo do post');
    expect(bruto).not.toContain(ADMIN);
    expect(bruto).not.toContain(TOKEN_PAGINA);
  });

  testeD1('grava também a tentativa recusada', async () => {
    const db = criarD1();
    const env = ambiente({ LEVIA_DB: db });
    await postar(env, '10.0.0.2', 'errado');
    const linha = await db.prepare('SELECT * FROM admin_auditoria').first();
    expect(linha).toMatchObject({ status: 401, motivo: 'nao_autorizado', ip: '10.0.0.2' });
    expect(JSON.stringify(linha)).not.toContain('errado');
  });

  test('falha do D1 não derruba a ação administrativa', async () => {
    const env = ambiente({ LEVIA_DB: { prepare() { throw new Error('d1 fora'); } } });
    const rede = interceptar({ id: '1234567890_56' });
    let r: Response;
    try {
      r = await postar(env, '10.0.0.3');
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(200);
    expect(await r!.json()).toEqual({ ok: true, id: '1234567890_56' });
  });
});

describe('auditoria no D1: quem não tem token não enche a tabela', () => {
  const contar = async (db: ReturnType<typeof criarD1>, where = '1=1') =>
    Number((await db.prepare(`SELECT COUNT(*) AS n FROM admin_auditoria WHERE ${where}`).first())!.n);

  testeD1('muitas recusas do mesmo IP gravam no máximo 3 linhas, mas todas ficam no log', async () => {
    const db = criarD1();
    const env = ambiente({ LEVIA_DB: db });
    const linhas = await capturarLogs(async () => {
      for (let i = 0; i < 40; i++) await postar(env, '9.9.9.9', 'errado');
    });
    expect(linhas).toHaveLength(40);
    expect(await contar(db, "ip = '9.9.9.9'")).toBe(3);
  });

  testeD1('recusas de muitos IPs diferentes respeitam o teto global da janela', async () => {
    const db = criarD1();
    const env = ambiente({ LEVIA_DB: db });
    for (let i = 0; i < 200; i++) await postar(env, `20.0.${Math.floor(i / 250)}.${i % 250}`, 'errado');
    expect(await contar(db)).toBe(60);
  });

  testeD1('rota sem ADMIN_TOKEN configurado também tem teto (503 sem token)', async () => {
    const db = criarD1();
    const env = ambiente({ LEVIA_DB: db, ADMIN_TOKEN: undefined });
    for (let i = 0; i < 30; i++) await postar(env, '8.8.8.8');
    expect(await contar(db, "ip = '8.8.8.8'")).toBe(3);
  });

  testeD1('ações autenticadas sempre gravam, mesmo com os tetos de recusa já atingidos', async () => {
    const db = criarD1();
    const env = ambiente({ LEVIA_DB: db });
    for (let i = 0; i < 200; i++) await postar(env, `30.0.0.${i % 250}`, 'errado');
    expect(await contar(db, "motivo = 'nao_autorizado'")).toBeLessThanOrEqual(60);
    const rede = interceptar({ id: '1234567890_99' });
    try {
      for (let i = 0; i < 5; i++) {
        const r = await chamar(env, '/v1/admin/pagina/post', {
          method: 'POST',
          headers: { ...autorizado, 'cf-connecting-ip': '30.1.1.1' },
          body: JSON.stringify({ mensagem: 'oi' }),
        });
        expect(r.status).toBe(200);
      }
    } finally {
      rede.restaurar();
    }
    expect(await contar(db, "motivo = 'ok'")).toBe(5);
  });

  testeD1('o teto vale por janela de 15 minutos: depois dela volta a gravar', async () => {
    const db = criarD1();
    const env = ambiente({ LEVIA_DB: db });
    for (let i = 0; i < 6; i++) await postar(env, '7.7.7.7', 'errado');
    expect(await contar(db, "ip = '7.7.7.7'")).toBe(3);
    // envelhece as 3 linhas para fora da janela
    db.sql('UPDATE admin_auditoria SET criado_em = criado_em - ?', 16 * 60 * 1000);
    await postar(env, '7.7.7.7', 'errado');
    expect(await contar(db, "ip = '7.7.7.7'")).toBe(4);
  });
});

describe('limite por IP da Cloudflare (binding ADMIN_LIMITE)', () => {
  function limitador(respostas: Array<boolean | Error>) {
    const chaves: string[] = [];
    const limit = jest.fn(async ({ key }: { key: string }) => {
      chaves.push(key);
      const r = respostas.length ? respostas.shift()! : true;
      if (r instanceof Error) throw r;
      return { success: r };
    });
    return { limit, chaves };
  }

  test('limite excedido devolve 429 com Retry-After, mesmo com o token certo, sem chamar a Meta', async () => {
    const { limit, chaves } = limitador([false]);
    const rede = interceptar({ id: '1_1' });
    let r: Response;
    try {
      r = await postar(ambiente({ ADMIN_LIMITE: { limit } }), '6.6.6.6');
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(429);
    expect(r!.headers.get('Retry-After')).toBe('60');
    expect(await r!.json()).toEqual({ erro: 'muitas_tentativas' });
    expect(rede.chamadas).toHaveLength(0);
    expect(chaves).toEqual(['6.6.6.6']); // a chave é o IP
  });

  test('dentro do limite a chamada segue normalmente', async () => {
    const { limit } = limitador([true]);
    const rede = interceptar({ id: '1234567890_77' });
    let r: Response;
    try {
      r = await postar(ambiente({ ADMIN_LIMITE: { limit } }), '6.6.6.7');
    } finally {
      rede.restaurar();
    }
    expect(r!.status).toBe(200);
    expect(limit).toHaveBeenCalledTimes(1);
  });

  test('se o binding falhar, não bloqueia (defesa em profundidade) e o token continua exigido', async () => {
    const espia = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { limit } = limitador([new Error('limitador fora'), new Error('limitador fora')]);
    const rede = interceptar({ id: '1_2' });
    let ok: Response; let negado: Response;
    try {
      ok = await postar(ambiente({ ADMIN_LIMITE: { limit } }), '6.6.6.8');
      negado = await postar(ambiente({ ADMIN_LIMITE: { limit } }), '6.6.6.8', 'errado');
    } finally {
      rede.restaurar();
      espia.mockRestore();
    }
    expect(ok!.status).toBe(200);
    expect(negado!.status).toBe(401);
  });

  test('sem o binding nada muda; sem ADMIN_TOKEN a rota continua fechada (503) antes do limitador', async () => {
    const semBinding = await postar(ambiente({ LEVIA_DB: undefined }), '6.6.6.9', 'errado');
    expect(semBinding.status).toBe(401);
    const { limit } = limitador([true]);
    const fechada = await postar(ambiente({ ADMIN_TOKEN: undefined, ADMIN_LIMITE: { limit } }), '6.6.6.10');
    expect(fechada.status).toBe(503);
    expect(limit).not.toHaveBeenCalled();
  });

  testeD1('o 429 do limitador também respeita o teto de gravação da auditoria', async () => {
    const db = criarD1();
    const { limit } = limitador(Array(30).fill(false));
    const env = ambiente({ LEVIA_DB: db, ADMIN_LIMITE: { limit } });
    for (let i = 0; i < 30; i++) await postar(env, '6.6.6.11');
    const n = Number((await db.prepare("SELECT COUNT(*) AS n FROM admin_auditoria WHERE ip = '6.6.6.11'").first())!.n);
    expect(n).toBe(3);
  });
});
