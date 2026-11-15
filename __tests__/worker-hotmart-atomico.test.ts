import worker from '../worker/src/index';
import { puxarVencidos } from '../worker/src/lembretes';
import { criarD1, temSqlite } from '../test-utils/d1';
import { emitirSerial } from '../worker/src/serial';

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
    buyer: { checkout_phone: '+5511987654321' },
    purchase: { transaction: 'HPA1', price: { value: 191.71 } },
    ...extra,
  },
});
const contar = (env: any, tabela: string) => Number(env.LEVIA_DB.sql(`SELECT COUNT(*) AS n FROM ${tabela}`)[0].n);

describe('Hotmart: acesso pago nunca fica sem serial', () => {
  teste('telefone ambíguo fica pendente sem conta, direito ou serial e alerta sem dados pessoais', async () => {
    const env = ambiente();
    env.ALERTA_WHATSAPP = '+35699506350';
    const corpo = evento('PURCHASE_APPROVED', {
      buyer: { checkout_phone: '34912345678', name: 'Pessoa fictícia', email: 'ficticio@example.test' },
    });
    expect(await (await hotmart(env, corpo)).json()).toEqual({ ok: true, pendente: 'sem_telefone' });
    expect(contar(env, 'accounts')).toBe(0);
    expect(contar(env, 'entitlements')).toBe(0);
    expect(contar(env, 'activation_codes')).toBe(0);
    const filas = env.LEVIA_DB.sql('SELECT id, phone, texto FROM wa_outbox');
    expect(filas).toHaveLength(1);
    expect(filas[0].id).toMatch(/^alerta-pgto-/);
    expect(filas[0].phone).toBe('+35699506350');
    expect(filas[0].texto).toContain('sem telefone');
    expect(filas[0].texto).not.toMatch(/34912345678|Pessoa fictícia|ficticio@example\.test/);
    expect(env.LEVIA_DB.sql('SELECT processing_result FROM payment_events')[0].processing_result).toBe('sem_telefone');
  });

  teste.each([
    ['+447123456789', '447123456789', 'Payment confirmed', 'monthly'],
    ['+34912345678', '0034912345678', '¡Pago confirmado!', 'annual'],
    ['+5511987654321', '5511987654321', 'Pagamento confirmado', 'annual'],
  ])('reconcilia teste e compra %s, repete e reembolsa', async (telefone, pagamento, mensagem, plano) => {
    const env = ambiente();
    const emissao: any = await emitirSerial(env, { telefone });
    const ativacao = await worker.fetch(new Request('https://w.test/v1/ativar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serial: emissao.serial, instalacao: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }),
    }), env);
    expect((await ativacao.json()).plano).toBe('teste');
    const contaTeste = env.LEVIA_DB.sql('SELECT account_id FROM trials')[0].account_id;
    const compra = evento('PURCHASE_APPROVED', {
      buyer: { checkout_phone: pagamento },
      product: { id: plano === 'monthly' ? 111 : 222 },
      purchase: { transaction: 'HP-IDENTIDADE' },
    });
    expect((await (await hotmart(env, compra)).json()).plano).toBe(plano);
    expect((await (await hotmart(env, compra)).json()).duplicado).toBe(true);
    expect(contar(env, 'accounts')).toBe(1);
    const direito = env.LEVIA_DB.sql('SELECT account_id, status FROM entitlements')[0];
    expect(direito.account_id).toBe(contaTeste);
    const filas = env.LEVIA_DB.sql("SELECT phone, texto FROM wa_outbox WHERE id LIKE 'pgto-%'");
    expect(filas).toHaveLength(2);
    expect(filas.every((m: any) => m.phone === telefone)).toBe(true);
    expect(filas[0].texto).toContain(mensagem);
    expect(filas[1].texto).toMatch(SERIAL);
    const estorno = evento('PURCHASE_REFUNDED', {
      buyer: { checkout_phone: pagamento },
      purchase: { transaction: 'HP-IDENTIDADE' },
    });
    expect((await (await hotmart(env, estorno)).json()).revogado).toBe(true);
    expect(env.LEVIA_DB.sql('SELECT status FROM entitlements')[0].status).toBe('revoked');
    expect(env.LEVIA_DB.sql('SELECT status FROM trials')[0].status).toBe('active');
  });

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
