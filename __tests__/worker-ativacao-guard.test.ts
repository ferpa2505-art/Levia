import { ativarSerial, validarLicenca } from '../worker/src/serial';
import { sha256 } from '../worker/src/cripto';
import { criarD1, temSqlite } from '../test-utils/d1';
import { pausarLeituraCodigo } from '../test-utils/barreira-ativacao';

const teste = temSqlite ? test : test.skip;
const AGORA = Date.parse('2026-01-01T00:00:00.000Z');
const FIM = new Date(AGORA + 30 * 86400000).toISOString();
const DEVICE_A = '00000000-0000-4000-8000-000000000001';
const DEVICE_B = '00000000-0000-4000-8000-000000000002';
const DEVICE_C = '00000000-0000-4000-8000-000000000003';
const SERIAL_PAGO = 'ABCDEFGHJKMNPQRS';
const SERIAL_OUTRO = 'BCDEFGHJKLMNPQRT';
function request(serial: string, instalacao: string, ip = '192.0.2.1') {
  return new Request('https://worker.test/v1/ativar', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': ip },
    body: JSON.stringify({ serial, instalacao }),
  });
}
async function cenario({ pago = true, trial = null as null | { status: string; expires: string }, entitlementStatus = 'active' } = {}) {
  const db = criarD1();
  const env: any = { LEVIA_DB: db, LICENCA_TOKEN_KEY: 'fixture-licenca', FOTOS_GRATIS_7D: '2', FOTOS_ASSINANTE_30D: '100', MAX_DISPOSITIVOS: '2' };
  const iso = new Date(AGORA).toISOString();
  db.sql("INSERT INTO accounts(id,email_hash,status,created_at,updated_at) VALUES ('acct','mail-hash','active',?,?)", iso, iso);
  if (pago) {
    db.sql(`INSERT INTO entitlements(id,account_id,plan,status,photo_limit,current_period_end,last_payment_id,created_at,updated_at)
      VALUES ('paid','acct','monthly',?,100,?,'paid-event',?,?)`, entitlementStatus, FIM, iso, iso);
  }
  if (trial) {
    db.sql(`INSERT INTO trials(account_id,started_at,expires_at,photo_limit,status,created_at,updated_at)
      VALUES ('acct',?, ?, 2, ?, ?, ?)`, '2025-12-01T00:00:00.000Z', trial.expires, trial.status, '2025-12-01T00:00:00.000Z', '2025-12-01T00:00:00.000Z');
  }
  db.sql(`INSERT INTO activation_codes(id,account_id,entitlement_id,code_hash,issued_at,expires_at)
    VALUES ('code','acct',?,?,?,?)`, pago ? 'paid' : null, await sha256(SERIAL_PAGO), iso, FIM);
  return { db, env };
}
async function ativar(c: Awaited<ReturnType<typeof cenario>>, serial = SERIAL_PAGO, device = DEVICE_A) {
  return ativarSerial(request(serial, device), c.env, AGORA);
}
beforeEach(() => { jest.spyOn(console, 'log').mockImplementation(() => {}); });
afterEach(() => { jest.restoreAllMocks(); });

describe('ativação: guardas de entitlement, trial e corrida', () => {
  teste('código pago ativa sem criar trial implícito', async () => {
    const c = await cenario();
    const r = await ativar(c);
    expect(r.status).toBe(200);
    expect(c.db.sql('SELECT * FROM trials')).toHaveLength(0);
    expect(c.db.sql('SELECT used_at FROM activation_codes')[0].used_at).not.toBeNull();
  });
  teste('trial ativo pré-existente não muda e continua válido depois do estorno do código pago', async () => {
    const c = await cenario({ trial: { status: 'active', expires: '2026-01-08T00:00:00.000Z' } });
    const antes = c.db.sql('SELECT * FROM trials');
    const r = await ativar(c);
    const corpo: any = await r.json();
    expect(r.status).toBe(200);
    expect(c.db.sql('SELECT * FROM trials')).toEqual(antes);
    c.db.sql("UPDATE entitlements SET status = 'revoked' WHERE id = 'paid'");
    c.db.sql("UPDATE activation_codes SET invalidated_at = '2026-01-01T00:00:01.000Z' WHERE id = 'code'");
    expect(await validarLicenca(c.env, corpo.licenca, DEVICE_A, AGORA)).toMatchObject({ ok: true, plano: 'teste' });
    expect(c.db.sql('SELECT * FROM trials')).toEqual(antes);
  });
  teste('assinatura diferente não autoriza código reembolsado e licença já válida permanece', async () => {
    const c = await cenario();
    const iso = new Date(AGORA).toISOString();
    c.db.sql(`INSERT INTO entitlements(id,account_id,plan,status,photo_limit,current_period_end,last_payment_id,created_at,updated_at)
      VALUES ('other','acct','annual','active',100,?,'other-event',?,?)`, FIM, iso, iso);
    c.db.sql(`INSERT INTO activation_codes(id,account_id,entitlement_id,code_hash,issued_at,expires_at)
      VALUES ('other-code','acct','other',?,?,?)`, await sha256(SERIAL_OUTRO), iso, FIM);
    const outra = await ativar(c, SERIAL_OUTRO, DEVICE_A);
    expect(outra.status).toBe(200);
    const corpo: any = await outra.json();
    c.db.sql("UPDATE entitlements SET status = 'revoked' WHERE id = 'paid'");
    // Código ainda não invalidado: a guarda do direito vinculado deve recusá-lo.
    expect((await ativar(c, SERIAL_PAGO, DEVICE_B)).status).toBe(403);
    expect(c.db.sql('SELECT * FROM installations')).toHaveLength(1);
    expect((await validarLicenca(c.env, corpo.licenca, DEVICE_A, AGORA)).ok).toBe(true);
  });
  for (const status of ['revoked', 'expired']) {
    teste(`direito vinculado ${status} com código não invalidado não deixa efeitos`, async () => {
      const c = await cenario({ entitlementStatus: status });
      expect((await ativar(c)).status).toBe(403);
      expect(c.db.sql('SELECT * FROM installations')).toHaveLength(0);
      expect(c.db.sql('SELECT * FROM trials')).toHaveLength(0);
      expect(c.db.sql('SELECT used_at FROM activation_codes')[0].used_at).toBeNull();
    });
  }
  teste('direito com status ativo mas período vencido não deixa efeitos', async () => {
    const c = await cenario();
    c.db.sql("UPDATE entitlements SET current_period_end='2025-01-01T00:00:00.000Z' WHERE id='paid'");
    expect((await ativar(c)).status).toBe(403);
    expect(c.db.sql('SELECT * FROM installations')).toHaveLength(0);
    expect(c.db.sql('SELECT used_at FROM activation_codes')[0].used_at).toBeNull();
  });
  teste('bloqueio depois da leitura inicial não autoriza nem grava efeitos', async () => {
    const c = await cenario();
    const barreira = pausarLeituraCodigo(c.db);
    const pendente = ativar(c);
    void pendente.catch(() => {});
    try {
      await barreira.entrada;
      c.db.sql("UPDATE accounts SET status = 'blocked' WHERE id = 'acct'");
    } finally { barreira.fechar(); }
    const r = await pendente;
    expect(r.status).toBe(403);
    expect(c.db.sql('SELECT * FROM installations')).toHaveLength(0);
    expect(c.db.sql('SELECT used_at FROM activation_codes')[0].used_at).toBeNull();
  }, 15000);
  teste('trial expirado não cria instalação nem consome código', async () => {
    const c = await cenario({ pago: false, trial: { status: 'active', expires: '2025-01-08T00:00:00.000Z' } });
    expect((await ativar(c)).status).toBe(402);
    expect(c.db.sql('SELECT * FROM installations')).toHaveLength(0);
    expect(c.db.sql('SELECT used_at FROM activation_codes')[0].used_at).toBeNull();
  });
  teste('fluxo grátis cria trial uma vez e segunda instalação não reinicia', async () => {
    const c = await cenario({ pago: false });
    expect((await ativar(c, SERIAL_PAGO, DEVICE_A)).status).toBe(200);
    const antes = c.db.sql('SELECT * FROM trials');
    expect((await ativar(c, SERIAL_PAGO, DEVICE_B)).status).toBe(200);
    expect(c.db.sql('SELECT * FROM trials')).toEqual(antes);
  });
  teste('instalação estrangeira, revogada e limite são classificados sem efeitos parciais', async () => {
    const iso = new Date(AGORA).toISOString();
    const estrangeira = await cenario();
    estrangeira.db.sql("INSERT INTO accounts(id,email_hash,status,created_at,updated_at) VALUES ('other-acct','other-mail','active',?,?)", iso, iso);
    estrangeira.db.sql("INSERT INTO installations(id,account_id,first_seen_at,last_seen_at) VALUES (?, 'other-acct', ?, ?)", DEVICE_A, iso, iso);
    expect((await ativar(estrangeira)).status).toBe(409);
    expect(estrangeira.db.sql('SELECT used_at FROM activation_codes')[0].used_at).toBeNull();
    const revogada = await cenario();
    revogada.db.sql("INSERT INTO installations(id,account_id,first_seen_at,last_seen_at,revoked_at) VALUES (?, 'acct', ?, ?, ?)", DEVICE_A, iso, iso, iso);
    expect((await ativar(revogada)).status).toBe(403);
    const limite = await cenario();
    for (const device of [DEVICE_A, DEVICE_B]) {
      limite.db.sql("INSERT INTO installations(id,account_id,first_seen_at,last_seen_at) VALUES (?, 'acct', ?, ?)", device, iso, iso);
    }
    expect((await ativar(limite, SERIAL_PAGO, DEVICE_C)).status).toBe(409);
    expect(limite.db.sql('SELECT * FROM installations')).toHaveLength(2);
    expect(limite.db.sql('SELECT used_at FROM activation_codes')[0].used_at).toBeNull();
  });
});
