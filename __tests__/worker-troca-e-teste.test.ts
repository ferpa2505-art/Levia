import worker from '../worker/src/index';
import { ativarSerial, emitirSerial } from '../worker/src/serial';
import { processarMensagemWhatsApp } from '../worker/src/fluxo';
import { TEXTOS } from '../worker/src/textos';
import { sha256 } from '../worker/src/cripto';
import { criarD1, temSqlite } from '../test-utils/d1';

const teste = temSqlite ? test : test.skip;
const AGORA = Date.parse('2026-01-01T00:00:00.000Z');
const ISO = new Date(AGORA).toISOString();
const FIM = new Date(AGORA + 365 * 86400000).toISOString();
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const A = uuid(1);
const B = uuid(2);
const C = uuid(3);
const SERIAL_TESTE = 'ABCDEFGHJKMNPQRS';
const SERIAL_PAGO = 'BCDEFGHJKLMNPQRT';
const SERIAL_PAGO_2 = 'CDEFGHJKLMNPQRTU';
const SERIAL_TESTE_2 = 'DEFGHJKLMNPQRTUV';

function pedido(serial: string, instalacao: string) {
  return new Request('https://worker.test/v1/ativar', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.9' },
    body: JSON.stringify({ serial, instalacao }),
  });
}

/** Contas fictícias: "teste" (só teste grátis), "paga" e "paga2" (plano ativo), "teste2" (só teste). */
async function cenario() {
  const db = criarD1();
  const env: any = { LEVIA_DB: db, LICENCA_TOKEN_KEY: 'fixture-licenca', FOTOS_GRATIS_7D: '2', FOTOS_ASSINANTE_30D: '100', MAX_DISPOSITIVOS: '2' };
  for (const [id, fone] of [['teste', 'h-teste'], ['paga', 'h-paga'], ['paga2', 'h-paga2'], ['teste2', 'h-teste2']]) {
    db.sql('INSERT INTO accounts(id,email_hash,phone_hash,status,created_at,updated_at) VALUES (?,?,?,\'active\',?,?)', id, `mail-${id}`, fone, ISO, ISO);
  }
  for (const [id, conta] of [['ent-paga', 'paga'], ['ent-paga2', 'paga2']]) {
    db.sql(`INSERT INTO entitlements(id,account_id,plan,status,photo_limit,current_period_end,last_payment_id,created_at,updated_at)
      VALUES (?,?,'annual','active',100,?,?,?,?)`, id, conta, FIM, `ev-${id}`, ISO, ISO);
  }
  const codigos: [string, string, string | null, string][] = [
    ['c-teste', 'teste', null, SERIAL_TESTE], ['c-paga', 'paga', 'ent-paga', SERIAL_PAGO],
    ['c-paga2', 'paga2', 'ent-paga2', SERIAL_PAGO_2], ['c-teste2', 'teste2', null, SERIAL_TESTE_2],
  ];
  for (const [id, conta, direito, serial] of codigos) {
    db.sql(`INSERT INTO activation_codes(id,account_id,entitlement_id,code_hash,issued_at,expires_at) VALUES (?,?,?,?,?,?)`,
      id, conta, direito, await sha256(serial), ISO, FIM);
  }
  const ativar = (serial: string, instalacao = A) => ativarSerial(pedido(serial, instalacao), env, AGORA);
  const contaDo = (instalacao: string) => (db.sql('SELECT account_id FROM installations WHERE id = ?', instalacao)[0] as any)?.account_id;
  return { db, env, ativar, contaDo };
}

beforeEach(() => { jest.spyOn(console, 'log').mockImplementation(() => {}); });
afterEach(() => { jest.restoreAllMocks(); });

describe('troca do serial do teste por um plano pago', () => {
  teste('o serial pago (mensal, anual ou vitalício) passa o aparelho do teste para o plano, sem reinstalar', async () => {
    const c = await cenario();
    expect((await c.ativar(SERIAL_TESTE)).status).toBe(200);
    expect(c.contaDo(A)).toBe('teste');
    const r = await c.ativar(SERIAL_PAGO);
    expect(r.status).toBe(200);
    expect(((await r.json()) as any).plano).toBe('assinatura');
    expect(c.contaDo(A)).toBe('paga');
  });

  teste('plano pago de mesmo alcance não puxa o aparelho de outra conta paga', async () => {
    const c = await cenario();
    c.db.sql("UPDATE entitlements SET current_period_end = ? WHERE id = 'ent-paga2'", FIM);
    expect((await c.ativar(SERIAL_PAGO)).status).toBe(200);
    const r = await c.ativar(SERIAL_PAGO_2);
    expect(r.status).toBe(409);
    expect(((await r.json()) as any).erro).toBe('instalacao_em_uso');
    expect(c.contaDo(A)).toBe('paga');
  });

  teste('mensal/anual comprado → serial vitalício passa o aparelho para o vitalício', async () => {
    const c = await cenario();
    c.db.sql("UPDATE entitlements SET current_period_end = NULL WHERE id = 'ent-paga2'");
    expect((await c.ativar(SERIAL_PAGO)).status).toBe(200);
    expect((await c.ativar(SERIAL_PAGO_2)).status).toBe(200);
    expect(c.contaDo(A)).toBe('paga2');
  });

  teste('vitalício nunca é rebaixado para um plano com fim', async () => {
    const c = await cenario();
    c.db.sql("UPDATE entitlements SET current_period_end = NULL WHERE id = 'ent-paga'");
    expect((await c.ativar(SERIAL_PAGO)).status).toBe(200);
    expect((await c.ativar(SERIAL_PAGO_2)).status).toBe(409);
    expect(c.contaDo(A)).toBe('paga');
  });

  teste('não troca um teste por outro teste', async () => {
    const c = await cenario();
    expect((await c.ativar(SERIAL_TESTE)).status).toBe(200);
    expect((await c.ativar(SERIAL_TESTE_2)).status).toBe(409);
    expect(c.contaDo(A)).toBe('teste');
  });

  teste('respeita o limite de aparelhos do plano pago', async () => {
    const c = await cenario();
    expect((await c.ativar(SERIAL_PAGO, B)).status).toBe(200);
    expect((await c.ativar(SERIAL_PAGO, C)).status).toBe(200);
    expect((await c.ativar(SERIAL_TESTE)).status).toBe(200);
    const r = await c.ativar(SERIAL_PAGO);
    expect(r.status).toBe(409);
    expect(((await r.json()) as any).erro).toBe('limite_dispositivos');
    expect(c.contaDo(A)).toBe('teste');
  });
});

describe('teste grátis uma vez por telefone', () => {
  const ambiente = () => {
    const db = criarD1();
    const env: any = {
      LEVIA_DB: db, LICENCA_TOKEN_KEY: 'chave-da-licenca', TYPEBOT_PHONE_HMAC_KEY: 'chave-telefone',
      EMAIL_HASH_KEY: 'chave-email', FOTOS_GRATIS_7D: '2',
    };
    return { db, env };
  };
  let n = 0;
  const falar = (env: any, texto: string, tel = '5511987650000') =>
    processarMensagemWhatsApp(env, tel, texto, `tt-${++n}`) as Promise<any>;
  async function cadastrar(env: any, tel?: string) {
    await falar(env, 'oi', tel);
    await falar(env, '1', tel);
    await falar(env, '1', tel);
    await falar(env, 'Maria Teste', tel);
    await falar(env, '2', tel);
    return falar(env, '3', tel);
  }
  const serialDe = (r: any) => r.resposta.match(/[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}/)?.[0];
  const ativar = (env: any, serial: string, instalacao = A) =>
    worker.fetch(new Request('https://worker.test/v1/ativar', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '1.1.1.1' },
      body: JSON.stringify({ serial, instalacao }),
    }), env);

  teste('apagar os dados e conversar de novo não dá outro teste de 7 dias', async () => {
    const { db, env } = ambiente();
    const primeiro = await cadastrar(env);
    expect((await ativar(env, serialDe(primeiro))).status).toBe(200);
    expect(db.sql('SELECT COUNT(*) AS n FROM testes_usados')[0]).toMatchObject({ n: 1 });

    expect((await falar(env, 'APAGAR')).tipo).toBe('confirmar_apagar');
    await falar(env, '1');
    expect(db.sql('SELECT COUNT(*) AS n FROM accounts')[0]).toMatchObject({ n: 0 });
    expect(db.sql('SELECT COUNT(*) AS n FROM testes_usados')[0]).toMatchObject({ n: 1 });

    const de_novo = await cadastrar(env);
    expect(de_novo.tipo).toBe('teste_ja_usado');
    expect(serialDe(de_novo)).toBeUndefined();
    expect(de_novo.resposta).toContain('#planos');
  });

  teste('mesmo com um serial emitido para a conta nova, a ativação não cria outro teste', async () => {
    const { db, env } = ambiente();
    const primeiro = await cadastrar(env);
    expect((await ativar(env, serialDe(primeiro))).status).toBe(200);
    await falar(env, 'APAGAR');
    await falar(env, '1');
    const emissao: any = await emitirSerial(env, { telefone: '+5511987650000' });
    expect(emissao.ok).toBe(true);
    const r = await ativar(env, emissao.serial, B);
    expect(r.status).toBe(402);
    expect(db.sql('SELECT COUNT(*) AS n FROM trials')[0]).toMatchObject({ n: 0 });
  });

  teste('SERIAL durante o teste devolve serial; depois que o teste acaba, devolve o link dos planos', async () => {
    const { db, env } = ambiente();
    const primeiro = await cadastrar(env);
    expect((await ativar(env, serialDe(primeiro))).status).toBe(200);
    const durante = await falar(env, 'SERIAL');
    expect(durante.tipo).toBe('serial_novo');
    db.sql("UPDATE trials SET expires_at = '2000-01-01T00:00:00.000Z'");
    const depois = await falar(env, 'SERIAL');
    expect(depois.tipo).toBe('teste_ja_usado');
    expect(depois.resposta).toContain('#planos');
  });

  teste('outro telefone continua recebendo o teste normalmente', async () => {
    const { env } = ambiente();
    const r = await cadastrar(env, '5511912340000');
    expect(r.tipo).toBe('finalizado');
    expect((await ativar(env, serialDe(r), C)).status).toBe(200);
  });
});

describe('mensagens de rotina não ensinam a apagar os dados', () => {
  test.each(Object.keys(TEXTOS))('%s', (idioma) => {
    const T: any = (TEXTOS as any)[idioma];
    const textos = [T.jaFinalizado, typeof T.serialUso === 'function' ? T.serialUso('https://leviapp.org/ativar') : T.serialUso];
    for (const t of textos) expect(String(t)).not.toMatch(/\*(APAGAR|DELETE|BORRAR|CANCELLA)\*/);
  });
});
