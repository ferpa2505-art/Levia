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
const envios = (env: any) => env.LEVIA_DB.sql('SELECT * FROM alerta_envios ORDER BY criado_em') as any[];
const comFetch = async (resposta: any, fn: () => Promise<void>) => {
  const original = global.fetch;
  (global as any).fetch = jest.fn(async () => resposta);
  try { await fn(); } finally { (global as any).fetch = original; }
};

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

  teste('registra que o Resend aceitou o e-mail, com a contagem do dia', async () => {
    const env = ambiente({ RESEND_API_KEY: 're_teste', ALERTA_EMAILS: 'dono@exemplo.com' });
    fila(env, 'pgto-1', AGORA - 2 * HORA);
    await comFetch({ ok: true, status: 200 }, async () => {
      const r = await alertarPagamentosPresos(env, AGORA);
      expect(r).toMatchObject({ alertado: true, whatsapp: true, email: true, emailStatus: 200, registrado: true });
    });
    const [linha] = envios(env);
    expect(linha).toMatchObject({ id: 'alerta-fila-2026-11-13', dia: '2026-11-13', presas: 1, houve_alerta: 1, whatsapp: 1, email: 1, email_status: 200 });
    expect(linha.email_erro).toBeNull();
    expect(JSON.stringify(linha)).not.toContain('11987654321');
  });

  teste('registra a recusa do Resend sem esconder que o WhatsApp foi enfileirado', async () => {
    const env = ambiente({ RESEND_API_KEY: 're_teste', ALERTA_EMAILS: 'dono@exemplo.com' });
    fila(env, 'pgto-1', AGORA - 2 * HORA);
    await comFetch({ ok: false, status: 403 }, async () => {
      const r = await alertarPagamentosPresos(env, AGORA);
      expect(r).toMatchObject({ alertado: true, whatsapp: true, email: false, emailStatus: 403 });
    });
    const [linha] = envios(env);
    expect(linha).toMatchObject({ houve_alerta: 1, email: 0, email_status: 403, email_erro: 'http_403' });
  });

  teste('sem ALERTA_EMAILS fica registrado o motivo de não ter saído e-mail', async () => {
    const env = ambiente({ RESEND_API_KEY: 're_teste' });
    fila(env, 'pgto-1', AGORA - 2 * HORA);
    await alertarPagamentosPresos(env, AGORA);
    const [linha] = envios(env);
    expect(linha).toMatchObject({ email: 0, email_erro: 'sem_alerta_emails' });
  });

  teste('grava a execução do dia mesmo quando nada está preso', async () => {
    const env = ambiente();
    await alertarPagamentosPresos(env, AGORA);
    const [linha] = envios(env);
    expect(linha).toMatchObject({ id: 'alerta-fila-2026-11-13', houve_alerta: 0, whatsapp: 0, email: 0, presas: 0, pagos_sem_aparelho: 0 });
    expect(alertas(env)).toHaveLength(0);
  });

  teste('histórico do alerta é apagado junto da limpeza, no prazo de 31 dias', async () => {
    const env = ambiente();
    env.LEVIA_DB.sql(
      "INSERT INTO alerta_envios (id, dia, criado_em, atualizado_em) VALUES ('alerta-fila-2026-09-01', '2026-09-01', ?, ?)",
      AGORA - 40 * DIA, AGORA - 40 * DIA,
    );
    const r = await limparVencidos(env, AGORA);
    expect(r.removidos.alerta_envios).toBe(1);
    expect(envios(env).map((l) => l.dia)).toEqual(['2026-11-13']);
  });
});
