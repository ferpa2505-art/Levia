import worker from '../worker/src/index';
import { puxarVencidos } from '../worker/src/lembretes';
import { criarD1, temSqlite } from '../test-utils/d1';

const teste = temSqlite ? test : test.skip;

function ambiente() {
  return {
    LEVIA_DB: criarD1(), LICENCA_TOKEN_KEY: 'k1', TYPEBOT_PHONE_HMAC_KEY: 'k2', EMAIL_HASH_KEY: 'k3',
    HOTMART_HOTTOK: 'hottok-secreto', PAYT_PRODUTOS_ANUAL: '222', PAYT_PRODUTOS_MENSAL: '111',
  } as any;
}
const hotmart = (env: any, corpo: any, hottok: string | null = 'hottok-secreto') =>
  worker.fetch(new Request('https://w.test/v1/hotmart/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(hottok ? { 'X-HOTMART-HOTTOK': hottok } : {}) },
    body: JSON.stringify(corpo),
  }), env);
const evento = (event: string, extra: any = {}) => ({
  event,
  data: {
    product: { id: 222 },
    buyer: { checkout_phone: '11987654321' },
    purchase: { transaction: 'HP1', price: { value: 191.71 } },
    ...extra,
  },
});

describe('webhook Hotmart', () => {
  teste('hottok errado é recusado', async () => {
    const r = await hotmart(ambiente(), evento('PURCHASE_APPROVED'), 'errado');
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ erro: 'nao_autorizado', recebido: 6, esperado: 14 }); // só tamanhos
  });

  teste('espaço ou quebra de linha nas pontas do hottok não atrapalha', async () => {
    const env = ambiente();
    env.HOTMART_HOTTOK = '  hottok-secreto\n';
    expect((await hotmart(env, evento('PURCHASE_BILLET_PRINTED'))).status).toBe(200);
  });

  teste('compra aprovada anual libera 365 dias e manda o serial', async () => {
    const env = ambiente();
    await env.LEVIA_DB.prepare('INSERT INTO wa_sessions (phone, stage, updated_at) VALUES (?, ?, ?)').bind('+5511987654321', 'x', 'agora').run();
    const corpo = await (await hotmart(env, evento('PURCHASE_APPROVED'))).json();
    expect(corpo.plano).toBe('annual');
    expect(Math.round((Date.parse(corpo.acessoAte) - Date.now()) / 86400000)).toBe(365);
    const msgs = await puxarVencidos(env, Date.now() + 1000);
    expect(msgs[1].texto).toMatch(/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/);
  });

  teste('plano mensal pelo valor, repetição ignorada e reembolso revoga', async () => {
    const env = ambiente();
    const mensal = evento('PURCHASE_APPROVED', { product: {}, purchase: { transaction: 'HP2', price: { value: 19.97 } } });
    expect((await (await hotmart(env, mensal)).json()).plano).toBe('monthly');
    expect((await (await hotmart(env, mensal)).json()).duplicado).toBe(true);
    await hotmart(env, evento('PURCHASE_REFUNDED', { product: {}, purchase: { transaction: 'HP2' } }));
    expect((await env.LEVIA_DB.prepare('SELECT status FROM entitlements').first()).status).toBe('revoked');
  });

  teste('compra de quem nunca falou com o bot entrega o serial mesmo assim', async () => {
    const env = ambiente();
    expect((await (await hotmart(env, evento('PURCHASE_APPROVED'))).json()).plano).toBe('annual');
    const msgs = await puxarVencidos(env, Date.now() + 1000);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].texto).toContain('Pagamento confirmado');
    expect(msgs[1].texto).toMatch(/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/);
  });

  teste('reconhece o plano pelo nome do produto mesmo com código novo', async () => {
    const env = ambiente();
    const corpo = await (await hotmart(env, evento('PURCHASE_APPROVED', {
      product: { id: 999, name: 'Leviã Anual' },
      purchase: { transaction: 'HP9', price: { value: 0 } },
    }))).json();
    expect(corpo.plano).toBe('annual');
  });

  teste('reconhece o mensal por preço promocional', async () => {
    const env = ambiente();
    const corpo = await (await hotmart(env, evento('PURCHASE_APPROVED', {
      product: {},
      purchase: { transaction: 'HP10', price: { value: 9.97 } },
    }))).json();
    expect(corpo.plano).toBe('monthly');
  });

  teste('plano desconhecido não cria conta e guarda o resumo do aviso', async () => {
    const env = ambiente();
    const corpo = await (await hotmart(env, evento('PURCHASE_APPROVED', {
      product: { id: 999, name: 'Curso de bolo' },
      purchase: { transaction: 'HP11', price: { value: 5 } },
    }))).json();
    expect(corpo.pendente).toBe('plano_desconhecido');
    const contas = await env.LEVIA_DB.prepare('SELECT COUNT(*) AS n FROM accounts').first();
    expect(contas.n).toBe(0);
    const linha = await env.LEVIA_DB.prepare("SELECT payload FROM payment_events WHERE event_type = 'paid'").first();
    const resumo = JSON.parse(linha.payload);
    expect(resumo.produto.id).toBe(999);
    expect(resumo.preco).toBe(5);
    expect(linha.payload).not.toContain('11987654321');
  });

  teste('eventos sem efeito (boleto impresso, atraso) são ignorados', async () => {
    const r = await hotmart(ambiente(), evento('PURCHASE_BILLET_PRINTED'));
    expect((await r.json()).ignorado).toBe('PURCHASE_BILLET_PRINTED');
  });
});
