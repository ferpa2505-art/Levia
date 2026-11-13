import worker from '../worker/src/index';
import { puxarVencidos } from '../worker/src/lembretes';
import { criarD1, temSqlite } from '../test-utils/d1';

/**
 * Pagamento × entrega do serial: acesso pago e mensagens do serial são gravados juntos.
 * Somente dados fictícios e SQLite em memória; nada de Hotmart, WhatsApp ou produção.
 */
const teste = temSqlite ? test : test.skip;
const SERIAL = /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/;

function ambiente() {
  return {
    LEVIA_DB: criarD1(), LICENCA_TOKEN_KEY: 'k1', TYPEBOT_PHONE_HMAC_KEY: 'k2', EMAIL_HASH_KEY: 'k3',
    HOTMART_HOTTOK: 'hottok-secreto', PRODUTOS_ANUAL: '222', PRODUTOS_MENSAL: '111',
  } as any;
}
const hotmart = (env: any, corpo: any) =>
  worker.fetch(new Request('https://w.test/v1/hotmart/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-HOTMART-HOTTOK': 'hottok-secreto' },
    body: JSON.stringify(corpo),
  }), env);
const evento = (event: string, extra: any = {}) => ({
  event,
  data: {
    product: { id: 222 },
    buyer: { checkout_phone: '11987654321' },
    purchase: { transaction: 'HPA1', price: { value: 191.71 } },
    ...extra,
  },
});
const contar = (env: any, tabela: string) => Number(env.LEVIA_DB.sql(`SELECT COUNT(*) AS n FROM ${tabela}`)[0].n);

describe('Hotmart: acesso pago nunca fica sem serial', () => {
  teste('se a fila do WhatsApp falha, nada é liberado e o reenvio do provedor entrega acesso e serial', async () => {
    const env = ambiente();
    env.LEVIA_DB.sql(
      "CREATE TRIGGER falha_fila BEFORE INSERT ON wa_outbox WHEN NEW.id LIKE 'pgto-%' BEGIN SELECT RAISE(ABORT, 'fila indisponivel'); END",
    );
    let primeira: Response | null = null;
    try { primeira = await hotmart(env, evento('PURCHASE_APPROVED')); } catch { primeira = null; }
    if (primeira) expect(primeira.status).toBeGreaterThanOrEqual(500);
    expect(contar(env, 'entitlements')).toBe(0);
    expect(contar(env, 'payment_events')).toBe(0); // desfeito: o reenvio não cai em "duplicado"

    env.LEVIA_DB.sql('DROP TRIGGER falha_fila');
    const corpo = await (await hotmart(env, evento('PURCHASE_APPROVED'))).json();
    expect(corpo.plano).toBe('annual');
    expect(contar(env, 'entitlements')).toBe(1);
    const msgs = await puxarVencidos(env, Date.now() + 1000);
    expect(msgs.some((m: any) => SERIAL.test(m.texto))).toBe(true);
  });

  teste('reenvio depois do sucesso não libera de novo nem duplica o serial', async () => {
    const env = ambiente();
    await hotmart(env, evento('PURCHASE_APPROVED'));
    expect((await (await hotmart(env, evento('PURCHASE_APPROVED'))).json()).duplicado).toBe(true);
    expect(contar(env, 'entitlements')).toBe(1);
    expect(Number(env.LEVIA_DB.sql("SELECT COUNT(*) AS n FROM wa_outbox WHERE id LIKE 'pgto-%'")[0].n)).toBe(2);
  });

  teste('estorno que chega antes da aprovação impede a liberação', async () => {
    const env = ambiente();
    await hotmart(env, evento('PURCHASE_REFUNDED', { purchase: { transaction: 'HPA2' } }));
    const corpo = await (await hotmart(env, evento('PURCHASE_APPROVED', {
      purchase: { transaction: 'HPA2', price: { value: 191.71 } },
    }))).json();
    expect(corpo.pendente).toBe('ja_revertido');
    expect(contar(env, 'entitlements')).toBe(0);
    expect(Number(env.LEVIA_DB.sql("SELECT COUNT(*) AS n FROM wa_outbox WHERE id LIKE 'pgto-%'")[0].n)).toBe(0);
  });

  teste('aprovação e conclusão da mesma compra liberam uma vez só', async () => {
    const env = ambiente();
    await hotmart(env, evento('PURCHASE_APPROVED'));
    expect((await (await hotmart(env, evento('PURCHASE_COMPLETE'))).json()).duplicado).toBe(true);
    expect(contar(env, 'entitlements')).toBe(1);
  });
});
