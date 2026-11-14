import { limparVencidos, limparLeadsAntigos } from '../worker/src/retencao';
import { hmacHex } from '../worker/src/cripto';
import { criarD1, temSqlite } from '../test-utils/d1';

const teste = temSqlite ? test : test.skip;
const DIA = 24 * 3600 * 1000;
const AGORA = Date.parse('2026-11-11T03:00:00Z');
const quando = (dias: number) => new Date(AGORA - dias * DIA).toISOString();
const CHAVE = 'chave-ficticia-telefone';

function ambiente(extra: any = {}) {
  const db = criarD1();
  return { db, env: { LEVIA_DB: db, TYPEBOT_PHONE_HMAC_KEY: CHAVE, ...extra } as any };
}
function lead(db: any, id: string, phone: string, diasDeIdade: number) {
  db.sql(
    'INSERT INTO leads (id, name, phone, source, consent_at, channel, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    id, 'Fulano', phone, 'whatsapp', quando(diasDeIdade), 'whatsapp', quando(diasDeIdade), quando(diasDeIdade),
  );
}
async function conta(db: any, id: string, phone: string, status = 'active') {
  const hash = await hmacHex(CHAVE, phone);
  db.sql(
    'INSERT INTO accounts (id, email_hash, phone_hash, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    id, `e-${id}`, hash, status, quando(300), quando(300),
  );
}
function direito(db: any, contaId: string, status: string, fimEmDias: number | null) {
  db.sql(
    `INSERT INTO entitlements (id, account_id, plan, status, photo_limit, current_period_start, current_period_end, created_at, updated_at)
     VALUES (?, ?, 'annual', ?, 100, ?, ?, ?, ?)`,
    `d-${contaId}`, contaId, status, quando(200), fimEmDias === null ? null : new Date(AGORA + fimEmDias * DIA).toISOString(), quando(200), quando(200),
  );
}
const ids = (db: any) => db.sql('SELECT id FROM leads ORDER BY id').map((l: any) => l.id);

describe('retenção de leads: 180 dias, só sem plano ativo', () => {
  teste('lead antigo sem conta é apagado; recente fica', async () => {
    const { db, env } = ambiente();
    lead(db, 'velho', '+5511900000001', 200);
    lead(db, 'recente', '+5511900000002', 10);
    const r = await limparVencidos(env, AGORA);
    expect(r.removidos.leads).toBe(1);
    expect(ids(db)).toEqual(['recente']);
  });

  teste('lead antigo com conta ativa mas sem plano é apagado', async () => {
    const { db, env } = ambiente();
    lead(db, 'velho', '+5511900000003', 200);
    await conta(db, 'c1', '+5511900000003');
    await limparLeadsAntigos(env, AGORA);
    expect(ids(db)).toEqual([]);
  });

  teste('lead antigo com plano anual ativo fica, qualquer que seja a idade', async () => {
    const { db, env } = ambiente();
    lead(db, 'anual', '+5511900000004', 400);
    await conta(db, 'c2', '+5511900000004');
    direito(db, 'c2', 'active', 120);
    const r = await limparLeadsAntigos(env, AGORA);
    expect(r).toMatchObject({ apagados: 0, mantidos: 1 });
    expect(ids(db)).toEqual(['anual']);
  });

  teste('plano vencido não protege o lead; teste de 7 dias ativo protege', async () => {
    const { db, env } = ambiente();
    lead(db, 'vencido', '+5511900000005', 300);
    await conta(db, 'c3', '+5511900000005');
    direito(db, 'c3', 'active', -5);
    lead(db, 'trial', '+5511900000006', 300);
    await conta(db, 'c4', '+5511900000006');
    db.sql("INSERT INTO trials (account_id, started_at, expires_at, photo_limit, created_at, updated_at) VALUES (?, ?, ?, 2, ?, ?)",
      'c4', quando(1), new Date(AGORA + 6 * DIA).toISOString(), quando(1), quando(1));
    await limparLeadsAntigos(env, AGORA);
    expect(ids(db)).toEqual(['trial']);
  });

  teste('conta bloqueada ou direito em estado incerto: o lead fica', async () => {
    const { db, env } = ambiente();
    lead(db, 'bloqueada', '+5511900000007', 300);
    await conta(db, 'c5', '+5511900000007', 'blocked');
    lead(db, 'atrasado', '+5511900000008', 300);
    await conta(db, 'c6', '+5511900000008');
    direito(db, 'c6', 'past_due', null);
    await limparLeadsAntigos(env, AGORA);
    expect(ids(db)).toEqual(['atrasado', 'bloqueada']);
  });

  teste('sem a chave do hash, ou com erro na consulta, nada é apagado', async () => {
    const { db, env } = ambiente({ TYPEBOT_PHONE_HMAC_KEY: undefined });
    lead(db, 'velho', '+5511900000009', 300);
    expect((await limparLeadsAntigos(env, AGORA)).apagados).toBe(0);
    const quebrado = { ...ambiente().env, LEVIA_DB: { prepare: (sql: string) => {
      const real = db.prepare(sql);
      return sql.includes('accounts') ? { bind: () => ({ first: async () => { throw new Error('falha'); } }) } : real;
    } } };
    expect((await limparLeadsAntigos(quebrado as any, AGORA)).apagados).toBe(0);
    expect(ids(db)).toEqual(['velho']);
  });

  teste('respeita o teto por execução (200 leads examinados)', async () => {
    const { db, env } = ambiente();
    for (let i = 0; i < 205; i++) lead(db, `l${String(i).padStart(3, '0')}`, `+55119100${String(i).padStart(5, '0')}`, 300);
    const r = await limparLeadsAntigos(env, AGORA);
    expect(r.examinados).toBe(200);
    expect(db.sql('SELECT COUNT(*) AS n FROM leads')[0].n).toBe(5);
  });
});
