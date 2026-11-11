import worker from '../worker/src/index';
import { processarMensagemWhatsApp } from '../worker/src/fluxo';
import { avisarEquipe } from '../worker/src/avisos';
import { limparVencidos } from '../worker/src/retencao';
import { criarD1, temSqlite } from '../test-utils/d1';

// node:sqlite só existe no Node 22.13+; sem ele estes testes são pulados (o CI usa Node 22)
const teste = temSqlite ? test : test.skip;

const TOKEN = 'token-do-gateway';
const TEL = '5511987654321';
const TEL_E164 = '+' + TEL;

function criarKv() {
  const mapa = new Map<string, string>();
  return {
    mapa,
    get: async (k: string) => mapa.get(k) ?? null,
    put: async (k: string, v: string) => { mapa.set(k, v); },
    delete: async (k: string) => { mapa.delete(k); },
  };
}

function ambiente(extra: Record<string, unknown> = {}) {
  const db = criarD1();
  const LEVIA_COTAS = criarKv();
  const env = {
    LEVIA_DB: db,
    LEVIA_COTAS,
    GATEWAY_TOKEN: TOKEN,
    LICENCA_TOKEN_KEY: 'chave-da-licenca',
    TYPEBOT_PHONE_HMAC_KEY: 'chave-telefone',
    EMAIL_HASH_KEY: 'chave-email',
    ...extra,
  } as any;
  return { db, env, kv: LEVIA_COTAS };
}

function leadRequest(corpo: unknown, ip = '9.9.9.9') {
  return new Request('https://worker.test/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': ip, Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(corpo),
  });
}

const DADOS_LEAD = { name: 'Maria Silva', phone: TEL_E164, email: 'maria@exemplo.com', pain_point: 'Emagrecer', source: 'typebot' };

let contador = 0;
const falar = (env: any, texto: string, tel = TEL) =>
  processarMensagemWhatsApp(env, tel, texto, `priv-${++contador}`) as Promise<any>;

const contar = (db: any, tabela: string) => (db.sql(`SELECT COUNT(*) AS n FROM ${tabela}`)[0] as any).n;

describe('/api/lead: autorização antes de gravar', () => {
  teste('sem o aceite (consentimento: true) nada é gravado e a data de consentimento não é inventada', async () => {
    const { db, env } = ambiente();
    const r = await worker.fetch(leadRequest(DADOS_LEAD), env);
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ erro: 'consentimento_obrigatorio' });
    expect(contar(db, 'leads')).toBe(0);
  });

  teste('consentimento explícito false também é recusado', async () => {
    const { db, env } = ambiente();
    const r = await worker.fetch(leadRequest({ ...DADOS_LEAD, consentimento: false }), env);
    expect(r.status).toBe(400);
    expect(contar(db, 'leads')).toBe(0);
  });

  teste('com o aceite, o lead é gravado com a data do aceite', async () => {
    const { db, env } = ambiente();
    const r = await worker.fetch(leadRequest({ ...DADOS_LEAD, consentimento: true }), env);
    expect(r.status).toBe(200);
    const linha = db.sql('SELECT consent_at FROM leads')[0] as any;
    expect(linha.consent_at).toBeTruthy();
  });

  teste('sem a chave do gateway a rota continua fechada', async () => {
    const { env } = ambiente();
    const r = await worker.fetch(new Request('https://worker.test/api/lead', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...DADOS_LEAD, consentimento: true }),
    }), env);
    expect(r.status).toBe(401);
  });
});

describe('apagar: cobre todos os caminhos de dados', () => {
  teste('lead do /api/lead guardado no KV (D1 indisponível) é removido ao apagar pelo WhatsApp', async () => {
    const { db, env, kv } = ambiente();
    const prepare = db.prepare.bind(db);
    db.prepare = (sql: string, args?: any[]) => {
      if (/INSERT INTO leads/.test(sql)) throw new Error('D1 indisponível');
      return prepare(sql, args);
    };
    const r = await worker.fetch(leadRequest({ ...DADOS_LEAD, consentimento: true }), env);
    expect(r.status).toBe(200);
    expect([...kv.mapa.keys()].filter((k) => k.startsWith('lead:tel:'))).toEqual([`lead:tel:${TEL_E164}`]);

    await falar(env, 'apagar', TEL);
    expect((await falar(env, '1', TEL)).tipo).toBe('apagado');
    expect([...kv.mapa.keys()].filter((k) => k.startsWith('lead:tel:'))).toHaveLength(0);
  });

  teste('avisos à equipe que levam o telefone do cliente são removidos ao apagar', async () => {
    const { db, env } = ambiente({ ALERTA_WHATSAPP: '+35699506350' });
    await avisarEquipe(env, { telefone: TEL_E164, nome: 'Maria', etapa: 'nome', idioma: 'pt-BR', motivo: 'pediu_atendente', agora: Date.now() });
    expect(contar(db, "wa_outbox WHERE texto LIKE '%5511987654321%'")).toBe(1);

    await falar(env, 'apagar', TEL);
    expect((await falar(env, '1', TEL)).tipo).toBe('apagado');
    expect(contar(db, "wa_outbox WHERE texto LIKE '%5511987654321%'")).toBe(0);
  });

  teste('se uma remoção falha, a confirmação NÃO diz apagado e a conversa segue para nova tentativa', async () => {
    const { db, env } = ambiente();
    await falar(env, 'oi', TEL);
    const prepare = db.prepare.bind(db);
    let falhar = true;
    db.prepare = (sql: string, args?: any[]) => {
      if (falhar && /DELETE FROM wa_outbox/.test(sql)) throw new Error('falha temporária');
      return prepare(sql, args);
    };
    await falar(env, 'apagar', TEL);
    const falhou = await falar(env, '1', TEL);
    expect(falhou.tipo).toBe('apagar_falhou');
    expect(falhou.resposta).not.toMatch(/Pronto/);

    falhar = false;
    expect((await falar(env, '1', TEL)).tipo).toBe('apagado');
  });

  teste('sem a chave que localiza a conta, não confirma o apagamento (o serial continuaria valendo)', async () => {
    const { env } = ambiente({ TYPEBOT_PHONE_HMAC_KEY: undefined });
    await falar(env, 'apagar', TEL);
    expect((await falar(env, '1', TEL)).tipo).toBe('apagar_falhou');
  });
});

describe('retenção: prazos da política rodam pelo cron, não por sorteio', () => {
  const DIA = 24 * 3600 * 1000;
  const AGORA = Date.parse('2026-11-11T03:00:00Z');
  const quando = (dias: number) => new Date(AGORA - dias * DIA).toISOString();

  teste('conversa vencida (4 dias) sai; conversa recente (1 dia) fica', async () => {
    const { db, env } = ambiente();
    db.sql('INSERT INTO wa_sessions (phone, stage, data_json, updated_at) VALUES (?, ?, ?, ?)', '+5511111111111', 'pergunta_nome', '{}', quando(4));
    db.sql('INSERT INTO wa_sessions (phone, stage, data_json, updated_at) VALUES (?, ?, ?, ?)', '+5511222222222', 'pergunta_nome', '{}', quando(1));
    const r = await limparVencidos(env, AGORA);
    expect(r.removidos.wa_sessions).toBe(1);
    expect(db.sql('SELECT phone FROM wa_sessions')).toEqual([{ phone: '+5511222222222' }]);
  });

  teste('contador de uso de 40 dias sai; de 5 dias fica', async () => {
    const { db, env } = ambiente();
    db.sql('INSERT INTO cotas_uso (chave, ts) VALUES (?, ?)', 'conta:a', AGORA - 40 * DIA);
    db.sql('INSERT INTO cotas_uso (chave, ts) VALUES (?, ?)', 'conta:b', AGORA - 5 * DIA);
    await limparVencidos(env, AGORA);
    expect(db.sql('SELECT chave FROM cotas_uso')).toEqual([{ chave: 'conta:b' }]);
  });

  teste('fila de lembretes com mais de 14 dias sai (tempo em milissegundos)', async () => {
    const { db, env } = ambiente();
    db.sql('INSERT INTO wa_outbox (id, phone, texto, enviar_em, criado_em) VALUES (?, ?, ?, ?, ?)', 'velho', '+5511222222222', 'x', AGORA - 20 * DIA, AGORA - 20 * DIA);
    db.sql('INSERT INTO wa_outbox (id, phone, texto, enviar_em, criado_em) VALUES (?, ?, ?, ?, ?)', 'novo', '+5511222222222', 'y', AGORA - DIA, AGORA - DIA);
    await limparVencidos(env, AGORA);
    expect(db.sql('SELECT id FROM wa_outbox')).toEqual([{ id: 'novo' }]);
  });

  teste('o cron (scheduled) executa a limpeza completa', async () => {
    const { db, env } = ambiente();
    db.sql('INSERT INTO wa_sessions (phone, stage, data_json, updated_at) VALUES (?, ?, ?, ?)', '+5511111111111', 'pergunta_nome', '{}', new Date(Date.now() - 10 * DIA).toISOString());
    const espera: Promise<unknown>[] = [];
    await (worker as any).scheduled({ cron: '0 3 * * *' }, env, { waitUntil: (p: Promise<unknown>) => espera.push(p) });
    await Promise.all(espera);
    expect(contar(db, 'wa_sessions')).toBe(0);
  });

  teste('falha em uma tabela não impede as outras', async () => {
    const { db, env } = ambiente();
    db.sql('INSERT INTO cotas_uso (chave, ts) VALUES (?, ?)', 'conta:a', AGORA - 40 * DIA);
    const prepare = db.prepare.bind(db);
    db.prepare = (sql: string, args?: any[]) => {
      if (/FROM wa_sessions/.test(sql)) throw new Error('falha');
      return prepare(sql, args);
    };
    const r = await limparVencidos(env, AGORA);
    expect(r.falhas).toEqual(['wa_sessions']);
    expect(contar(db, 'cotas_uso')).toBe(0);
  });
});
