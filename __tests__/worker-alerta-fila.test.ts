import { alertarPagamentosPresos, medirPagamentosPresos } from '../worker/src/alertaFila';
import { limparVencidos } from '../worker/src/retencao';
import { criarD1, temSqlite } from '../test-utils/d1';

/** Alerta diário de entregas de pagamento presas: só dados fictícios, SQLite em memória. */
const teste = temSqlite ? test : test.skip;
const AGORA = Date.parse('2026-11-13T07:00:00Z');
const HORA = 3600 * 1000;
const DIA = 24 * HORA;

function ambiente(extra: any = {}) {
  return { LEVIA_DB: criarD1(), ALERTA_WHATSAPP: '+35699506350', ...extra } as any;
}
const fila = (env: any, id: string, criado: number, enviado: number | null = null, cancelado: number | null = null) =>
  env.LEVIA_DB.sql(
    'INSERT INTO wa_outbox (id, phone, texto, enviar_em, criado_em, enviado_em, cancelado_em) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id, '+5511987654321', 'ABCD-EFGH-JKLM-NPQR', criado, criado, enviado, cancelado,
  );
const conta = (env: any, id: string) =>
  env.LEVIA_DB.sql('INSERT INTO accounts (id, email_hash, phone_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', id, `e-${id}`, `p-${id}`, 'x', 'x');
const pago = (env: any, id: string, contaId: string, criado: number) =>
  env.LEVIA_DB.sql(
    "INSERT INTO entitlements (id, account_id, plan, status, current_period_end, created_at, updated_at) VALUES (?, ?, 'annual', 'active', ?, ?, ?)",
    id, contaId, new Date(AGORA + 300 * DIA).toISOString(), new Date(criado).toISOString(), new Date(criado).toISOString(),
  );
const alertas = (env: any) => env.LEVIA_DB.sql("SELECT texto FROM wa_outbox WHERE id LIKE 'alerta-fila-%'") as { texto: string }[];

describe('alerta diário de entregas de pagamento presas', () => {
  teste('sem nada preso, nenhum alerta', async () => {
    const env = ambiente();
    fila(env, 'pgto-recente', AGORA - 5 * 60 * 1000);
    fila(env, 'pgto-enviada', AGORA - 3 * HORA, AGORA - 3 * HORA);
    fila(env, 'pgto-cancelada', AGORA - 3 * HORA, null, AGORA);
    fila(env, 'lembrete-cliente', AGORA - 5 * HORA);
    const r = await alertarPagamentosPresos(env, AGORA);
    expect(r.alertado).toBe(false);
    expect(alertas(env)).toHaveLength(0);
  });

  teste('mensagens de compra presas e pagos sem aparelho geram um alerta sem dados pessoais', async () => {
    const env = ambiente();
    fila(env, 'pgto-1', AGORA - 2 * HORA);
    fila(env, 'pgto-2', AGORA - 13 * DIA);
    conta(env, 'c1'); pago(env, 'e1', 'c1', AGORA - 2 * DIA);
    conta(env, 'c2'); pago(env, 'e2', 'c2', AGORA - 2 * DIA);
    env.LEVIA_DB.sql("INSERT INTO installations (id, account_id, first_seen_at, last_seen_at) VALUES ('i2', 'c2', 'x', 'x')");
    conta(env, 'c3'); pago(env, 'e3', 'c3', AGORA - 2 * HORA); // pago há pouco: ainda não conta

    const r = await alertarPagamentosPresos(env, AGORA);
    expect(r).toMatchObject({ presas: 2, pertoDeApagar: 1, pagosSemAparelho: 1, alertado: true, whatsapp: true });
    const [alerta] = alertas(env);
    expect(alerta.texto).toContain('presas na fila: 2');
    expect(alerta.texto).toContain('sem nenhum aparelho ativado: 1');
    expect(alerta.texto).not.toContain('11987654321');
    expect(alerta.texto).not.toContain('ABCD-EFGH');
  });

  teste('no máximo um alerta por dia', async () => {
    const env = ambiente();
    fila(env, 'pgto-1', AGORA - 2 * HORA);
    await alertarPagamentosPresos(env, AGORA);
    const segundo = await alertarPagamentosPresos(env, AGORA + HORA);
    expect(segundo.repetido).toBe(true);
    expect(alertas(env)).toHaveLength(1);
    await alertarPagamentosPresos(env, AGORA + DIA);
    expect(alertas(env)).toHaveLength(2);
  });

  teste('também sai por e-mail, que funciona mesmo com o gateway parado', async () => {
    const env = ambiente({ RESEND_API_KEY: 're_teste', ALERTA_EMAILS: 'dono@exemplo.com' });
    fila(env, 'pgto-1', AGORA - 2 * HORA);
    const chamadas: any[] = [];
    const original = global.fetch;
    (global as any).fetch = jest.fn(async (url: string, init: any) => { chamadas.push({ url, init }); return { ok: true, status: 200 }; });
    try {
      const r = await alertarPagamentosPresos(env, AGORA);
      expect(r.email).toBe(true);
    } finally {
      (global as any).fetch = original;
    }
    expect(chamadas).toHaveLength(1);
    const corpo = JSON.parse(chamadas[0].init.body);
    expect(corpo.to).toEqual(['dono@exemplo.com']);
    expect(corpo.text).not.toContain('11987654321');
  });

  teste('a limpeza diária confere antes de apagar', async () => {
    const env = ambiente();
    fila(env, 'pgto-antiga', AGORA - 15 * DIA); // já passou dos 14 dias: conta no alerta e depois sai
    const r = await limparVencidos(env, AGORA);
    expect(r.alertaFila?.presas).toBe(1);
    expect(r.removidos.wa_outbox).toBe(1);
    expect(alertas(env)).toHaveLength(1); // o alerta de hoje fica na fila
  });

  teste('medição sem banco não quebra', async () => {
    expect(await medirPagamentosPresos({} as any, AGORA)).toEqual({ presas: 0, maisAntigaHoras: 0, pertoDeApagar: 0, pagosSemAparelho: 0 });
  });
});
