import worker from '../worker/src/index';
import { puxarVencidos } from '../worker/src/lembretes';
import { telefoneDoComprador } from '../worker/src/pagamentos';
import { processarMensagemWhatsApp } from '../worker/src/fluxo';
import { criarD1, temSqlite } from '../test-utils/d1';

const teste = temSqlite ? test : test.skip;

function ambiente() {
  return {
    LEVIA_DB: criarD1(), LICENCA_TOKEN_KEY: 'k1', TYPEBOT_PHONE_HMAC_KEY: 'k2', EMAIL_HASH_KEY: 'k3',
    HOTMART_HOTTOK: 'hottok-secreto', PRODUTOS_ANUAL: '222', PRODUTOS_MENSAL: '111',
    ALERTA_WHATSAPP: '+35699506350',
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
    buyer: { checkout_phone: '+5511987654321' },
    purchase: { transaction: 'HP1', price: { value: 191.71 } },
    ...extra,
  },
});

describe('webhook Hotmart', () => {
  teste('hottok errado é recusado', async () => {
    const r = await hotmart(ambiente(), evento('PURCHASE_APPROVED'), 'errado');
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ erro: 'nao_autorizado' }); // sem revelar o tamanho do token esperado
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

  teste('plano mensal pelo código, repetição ignorada e reembolso revoga', async () => {
    const env = ambiente();
    const mensal = evento('PURCHASE_APPROVED', { product: { id: 111 }, purchase: { transaction: 'HP2', price: { value: 19.97 } } });
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

  teste('quem acabou de pagar e escreve ao bot antes da entrega ainda recebe o serial (a mensagem do comprador não cancela o envio)', async () => {
    const env = ambiente();
    const agora = Date.now();
    const corpo = await (await hotmart(env, evento('PURCHASE_APPROVED'))).json();
    expect(corpo.plano).toBe('annual');
    // o comprador manda "oi" ao bot logo depois do pagamento, antes de o gateway buscar a fila
    await processarMensagemWhatsApp(env, '5511987654321', 'oi', 'msg-apos-compra', agora + 500);
    const entregues = await puxarVencidos(env, agora + 5000);
    const serial = entregues.find((m: any) => /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/.test(m.texto));
    expect(serial).toBeTruthy();
  });

  teste('nome do produto com código novo NÃO libera plano (só alerta)', async () => {
    const env = ambiente();
    const corpo = await (await hotmart(env, evento('PURCHASE_APPROVED', {
      product: { id: 999, name: 'Leviã Anual' },
      purchase: { transaction: 'HP9', price: { value: 0 } },
    }))).json();
    expect(corpo.plano).toBeUndefined();
    expect(corpo.pendente).toBe('plano_desconhecido');
  });

  teste('preço promocional sem código conhecido NÃO libera plano (só alerta)', async () => {
    const env = ambiente();
    const corpo = await (await hotmart(env, evento('PURCHASE_APPROVED', {
      product: {},
      purchase: { transaction: 'HP10', price: { value: 9.97 } },
    }))).json();
    expect(corpo.plano).toBeUndefined();
    expect(corpo.pendente).toBe('plano_desconhecido');
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

  teste('alerta de pagamento não reconhecido sai no WhatsApp sem dados pessoais', async () => {
    const env = ambiente();
    await hotmart(env, evento('PURCHASE_APPROVED', {
      product: { id: 999, name: 'Curso de bolo' },
      purchase: { transaction: 'HP12', price: { value: 5 } },
    }));
    const alerta = await env.LEVIA_DB.prepare("SELECT phone, texto FROM wa_outbox WHERE id LIKE 'alerta-pgto-%'").first();
    expect(alerta.phone).toBe('+35699506350');
    expect(alerta.texto).toContain('HP12');
    expect(alerta.texto).toContain('plano não identificado');
    expect(alerta.texto).toContain('R$ 5,00');
    expect(alerta.texto).not.toContain('11987654321');
    // o gateway filtra por prefixo: o alerta precisa passar pelo mesmo filtro dos avisos
    const entregues = await puxarVencidos(env, Date.now() + 1000, 50);
    expect(entregues.some((m: { id: string }) => m.id.startsWith('alerta-pgto-'))).toBe(true);
  });

  teste('o mesmo aviso não gera alerta repetido', async () => {
    const env = ambiente();
    const corpo = evento('PURCHASE_APPROVED', {
      product: { id: 999, name: 'Curso de bolo' },
      purchase: { transaction: 'HP13', price: { value: 5 } },
    });
    await hotmart(env, corpo);
    await hotmart(env, corpo);
    const n = await env.LEVIA_DB.prepare("SELECT COUNT(*) AS n FROM wa_outbox WHERE id LIKE 'alerta-pgto-%'").first();
    expect(n.n).toBe(1);
  });

  teste('compra sem telefone também avisa a equipe', async () => {
    const env = ambiente();
    const r = await (await hotmart(env, evento('PURCHASE_APPROVED', {
      buyer: {},
      purchase: { transaction: 'HP14', price: { value: 191.71 } },
    }))).json();
    expect(r.pendente).toBe('sem_telefone');
    const alerta = await env.LEVIA_DB.prepare("SELECT texto FROM wa_outbox WHERE id LIKE 'alerta-pgto-%'").first();
    expect(alerta.texto).toContain('sem telefone');
  });

  teste('alerta de pagamento também sai por e-mail sem dados pessoais', async () => {
    const env = ambiente();
    env.RESEND_API_KEY = 're_teste';
    env.ALERTA_EMAILS = 'dono@exemplo.com, invalido, outro@exemplo.com';
    const chamadas: { url: string; init: { body: string } }[] = [];
    const original = global.fetch;
    (global as unknown as { fetch: unknown }).fetch = jest.fn(async (url: string, init: { body: string }) => {
      chamadas.push({ url, init });
      return { ok: true, status: 200 };
    });
    try {
      await hotmart(env, evento('PURCHASE_APPROVED', {
        product: { id: 999, name: 'Curso de bolo' },
        purchase: { transaction: 'HP15', price: { value: 5 } },
      }));
    } finally {
      (global as unknown as { fetch: unknown }).fetch = original;
    }
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0].url).toBe('https://api.resend.com/emails');
    const corpo = JSON.parse(chamadas[0].init.body);
    expect(corpo.to).toEqual(['dono@exemplo.com', 'outro@exemplo.com']);
    expect(corpo.subject).toContain('HP15');
    expect(corpo.text).toContain('plano não identificado');
    expect(corpo.text).not.toContain('11987654321');
  });

  teste('eventos sem efeito (boleto impresso, atraso) são ignorados', async () => {
    const r = await hotmart(ambiente(), evento('PURCHASE_BILLET_PRINTED'));
    expect((await r.json()).ignorado).toBe('PURCHASE_BILLET_PRINTED');
  });
});

describe('telefone internacional', () => {
  teste('compra com número de Malta entrega o serial para o número certo', async () => {
    const env = ambiente();
    const r = await (await hotmart(env, evento('PURCHASE_APPROVED', {
      buyer: { checkout_phone: '+35699506350' },
      product: { id: 111 },
      purchase: { transaction: 'HP-MT', price: { value: 19.97 } },
    }))).json();
    expect(r.plano).toBe('monthly');
    const msgs = await puxarVencidos(env, Date.now() + 1000);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].texto).toContain('Payment confirmed');
    expect(msgs[0].texto).toContain('(UTC)');
    expect(msgs[1].telefone).toBe('35699506350');
    expect(msgs[1].texto).toMatch(/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/);
  });

  test.each([
    ['+35699506350', '+35699506350'],
    ['00351912345678', '+351912345678'],
    ['+55 11 98765-4321', '+5511987654321'],
    ['11987654321', null], // pode ser Brasil ou DDI 1
    ['(11) 3456-7890', null], // também admite DDI 1 pelo analisador
    ['21987654321', null], // lista de DDIs incompleta não comprova ausência de conflito
    ['79912345678', null], // pode ser +7, DDI fora da lista
    ['5511987654321', '+5511987654321'],
    ['+34912345678', '+34912345678'],
    ['0034912345678', '+34912345678'],
    ['34912345678', null], // Espanha ou DDD brasileiro 34
    ['+447123456789', '+447123456789'],
    ['447123456789', '+447123456789'],
    ['35699506350', '+35699506350'], // Hotmart manda sem o "+"
    ['351912345678', '+351912345678'],
    ['441234567890', '+441234567890'],
    ['', null],
    ['abc', null],
  ] as [string, string | null][])('normaliza %s para %s', (entrada, esperado) => {
    expect(telefoneDoComprador(entrada)).toBe(esperado);
  });

  test.each([
    // país declarado BR desfaz a ambiguidade do número nacional sem DDI
    ['11987654321', 'BR', '+5511987654321'],
    ['(11) 3456-7890', 'BR', '+551134567890'],
    ['011987654321', 'BR', '+5511987654321'],
    ['31987654321', 'br', '+5531987654321'],
    ['5511987654321', 'BR', '+5511987654321'],
    ['+35699506350', 'BR', '+35699506350'], // DDI explícito sempre manda
    ['35699506350', 'BR', '+35699506350'], // não tem formato brasileiro: segue a regra de DDI
    // país diferente de BR (ou ausente) mantém a recusa segura
    ['11987654321', 'US', null],
    ['31987654321', 'NL', null],
    ['11987654321', '', null],
    ['12345', 'BR', null],
  ] as [string, string, string | null][])('com país %s/%s normaliza para %s', (entrada, pais, esperado) => {
    expect(telefoneDoComprador(entrada, pais)).toBe(esperado);
  });

  teste('comprador do Brasil com número sem DDI recebe o serial no +55', async () => {
    const env = ambiente();
    const r = await (await hotmart(env, evento('PURCHASE_APPROVED', {
      buyer: { checkout_phone: '11987654321', address: { country_iso: 'BR' } },
      product: { id: 111 },
      purchase: { transaction: 'HP-BR-SEM-DDI', price: { value: 19.97 } },
    }))).json();
    expect(r.plano).toBe('monthly');
    expect(r.pendente).toBeUndefined();
    const msgs = await puxarVencidos(env, Date.now() + 1000);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].texto).toContain('Pagamento confirmado');
    expect(msgs[1].telefone).toBe('5511987654321');
  });

  teste('número sem DDI e sem país continua pendente (não adivinha)', async () => {
    const env = ambiente();
    const r = await (await hotmart(env, evento('PURCHASE_APPROVED', {
      buyer: { checkout_phone: '11987654321' },
      product: { id: 111 },
      purchase: { transaction: 'HP-SEM-PAIS', price: { value: 19.97 } },
    }))).json();
    expect(r.pendente).toBe('sem_telefone');
  });
});
