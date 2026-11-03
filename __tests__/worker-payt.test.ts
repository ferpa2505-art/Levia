import worker from '../worker/src/index';
import { puxarVencidos } from '../worker/src/lembretes';
import { criarD1, temSqlite } from '../test-utils/d1';

const teste = temSqlite ? test : test.skip;
const TEL = '+5511987654321';
const A = '00000000-0000-4000-8000-000000000001';

function ambiente() {
  const env = {
    LEVIA_DB: criarD1(), LICENCA_TOKEN_KEY: 'k1', TYPEBOT_PHONE_HMAC_KEY: 'k2', EMAIL_HASH_KEY: 'k3',
    PAYT_INTEGRATION_KEY: 'chave-payt', PAYT_PRODUTOS_ANUAL: 'ANUAL1', PAYT_PRODUTOS_MENSAL: 'MENSAL1',
  } as any;
  return env;
}
const payt = (env: any, corpo: any, url = 'https://w.test/v1/payt/webhook') =>
  worker.fetch(new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) }), env);
const compra = (extra: any = {}) => ({
  integration_key: 'chave-payt', status: 'finished', transaction_id: 'T1',
  customer: { phone: '(11) 98765-4321' }, product: { code: 'ANUAL1' }, ...extra,
});

describe('webhook PAYT', () => {
  teste('chave errada é recusada', async () => {
    const r = await payt(ambiente(), compra({ integration_key: 'x' }));
    expect(r.status).toBe(401);
  });

  teste('compra anual libera 365 dias, grava serial e avisa no WhatsApp', async () => {
    const env = ambiente();
    await env.LEVIA_DB.prepare('INSERT INTO wa_sessions (phone, stage, updated_at) VALUES (?, ?, ?)').bind(TEL, 'x', 'agora').run();
    const r = await payt(env, compra());
    const corpo = await r.json();
    expect(corpo.plano).toBe('annual');
    const dias = (Date.parse(corpo.acessoAte) - Date.now()) / 86400000;
    expect(Math.round(dias)).toBe(365);
    const msgs = await puxarVencidos(env, Date.now() + 1000);
    expect(msgs).toHaveLength(2);
    expect(msgs[1].texto).toMatch(/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/);
  });

  teste('aviso repetido não libera duas vezes', async () => {
    const env = ambiente();
    await payt(env, compra());
    const r = await payt(env, compra());
    expect((await r.json()).duplicado).toBe(true);
    const n = await env.LEVIA_DB.prepare('SELECT COUNT(*) AS n FROM entitlements').first();
    expect(n.n).toBe(1);
  });

  teste('plano mensal por valor pago, e estorno revoga', async () => {
    const env = ambiente();
    const r = await payt(env, compra({ product: {}, transaction: { total_price: '19,97' } }));
    expect((await r.json()).plano).toBe('monthly');
    await payt(env, compra({ status: 'refunded' }));
    const d = await env.LEVIA_DB.prepare('SELECT status FROM entitlements').first();
    expect(d.status).toBe('revoked');
  });

  teste('aguardando pagamento é ignorado', async () => {
    const env = ambiente();
    const r = await payt(env, compra({ status: 'waiting_payment' }));
    expect((await r.json()).ignorado).toBe('waiting_payment');
  });
});
