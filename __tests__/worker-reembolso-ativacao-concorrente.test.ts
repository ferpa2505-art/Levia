import worker from '../worker/src/index';
import { processarPagamento } from '../worker/src/pagamentos';
import { validarLicenca } from '../worker/src/serial';
import { criarD1, temSqlite } from '../test-utils/d1';

// Regressões de segurança: expectativas normais, sem skip/failing para esconder bugs.
// SQLite real com todas as migrations; não é Cloudflare D1/workerd remoto.
const teste = temSqlite ? test : test.skip;
const APARELHO = '00000000-0000-4000-8000-000000000001';
const COMPRA = 'COMPRA-FICTICIA-CORRIDA';
const SERIAL = /^[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}$/;

async function cenario() {
  const db = criarD1();
  const env: any = {
    LEVIA_DB: db,
    LICENCA_TOKEN_KEY: 'chave-ficticia-licenca',
    TYPEBOT_PHONE_HMAC_KEY: 'chave-ficticia-telefone',
    EMAIL_HASH_KEY: 'chave-ficticia-email',
    FOTOS_GRATIS_7D: '2',
  };
  const dados = {
    idEvento: COMPRA,
    telefone: '+5511900000099',
    produtos: ['Plano mensal'],
    valorCentavos: 1997,
  };
  const compra = await processarPagamento(env, 'hotmart', 'paid', dados, { fixture: 'paid' });
  expect(compra.status).toBe(200);
  expect(await compra.json()).toMatchObject({ ok: true, plano: 'monthly' });
  const mensagens = db.sql('SELECT texto FROM wa_outbox') as any[];
  const serial = mensagens.map((m) => m.texto).find((s) => SERIAL.test(s));
  expect(serial).toBeDefined();
  const direito: any = db.sql('SELECT * FROM entitlements')[0];
  expect(db.sql('SELECT * FROM trials')).toHaveLength(0);

  const ativar = () => worker.fetch(new Request('https://worker.test/v1/ativar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.1' },
    body: JSON.stringify({ serial, instalacao: APARELHO }),
  }), env);
  const reembolsar = async () => {
    const r = await processarPagamento(env, 'hotmart', 'reverted', dados, { fixture: 'reverted' });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ ok: true, revogado: true });
  };
  return { db, env, direito, ativar, reembolsar };
}

/**
 * Executa a leitura SQL verdadeira, guarda o resultado e pausa ANTES de devolvê-lo
 * ao ativador. O reembolso pode então confirmar enquanto a ativação ainda tem
 * uma leitura antiga. Nenhuma regra de negócio é mockada ou copiada.
 * A barreira fica fora de batch/transação; não induz nested BEGIN no harness.
 */
function pausarDepoisDeLerCodigo(db: any) {
  const prepararOriginal = db.prepare;
  let sinalizar!: () => void;
  let liberar!: () => void;
  let cancelarTimeout: ReturnType<typeof setTimeout>;
  let capturas = 0;
  const entrada = new Promise<void>((resolve, reject) => {
    sinalizar = resolve;
    cancelarTimeout = setTimeout(() => reject(new Error('A leitura do serial não atingiu a barreira em 2s')), 2000);
  });
  const saida = new Promise<void>((resolve) => { liberar = resolve; });

  db.prepare = (sql: string) => {
    const statement = prepararOriginal(sql);
    if (!/FROM\s+activation_codes\s+c\s+JOIN\s+accounts\s+a/i.test(sql)) return statement;
    function envolver(s: any): any {
      return {
        ...s,
        bind: (...args: any[]) => envolver(s.bind(...args)),
        async first() {
          const linha = await s.first();
          if (capturas++ === 0) {
            clearTimeout(cancelarTimeout);
            sinalizar();
            await saida;
          }
          return linha;
        },
      };
    }
    return envolver(statement);
  };
  return {
    entrada,
    fechar() {
      clearTimeout(cancelarTimeout);
      liberar();
      db.prepare = prepararOriginal;
    },
  };
}

async function reembolsarDuranteAtivacao(c: Awaited<ReturnType<typeof cenario>>) {
  const barreira = pausarDepoisDeLerCodigo(c.db);
  const pendente = c.ativar();
  try {
    await barreira.entrada;
    await c.reembolsar();
  } catch (erro) {
    barreira.fechar();
    await Promise.allSettled([pendente]);
    throw erro;
  } finally {
    barreira.fechar();
  }
  return pendente;
}

function esperarRevogacao(c: Awaited<ReturnType<typeof cenario>>) {
  const direito: any = c.db.sql('SELECT * FROM entitlements WHERE id = ?', c.direito.id)[0];
  expect(direito.status).toBe('revoked');
  expect(direito.current_period_end).toBe(c.direito.current_period_end);
  expect(direito.photo_limit).toBe(c.direito.photo_limit);
  const codigos = c.db.sql('SELECT invalidated_at FROM activation_codes WHERE entitlement_id = ?', c.direito.id) as any[];
  expect(codigos).toHaveLength(1);
  expect(codigos[0].invalidated_at).not.toBeNull();
  expect(c.db.sql('SELECT * FROM entitlements')).toHaveLength(1);
}

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(async () => {
    throw new Error('Teste isolado: chamada de rede não permitida');
  });
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); });

describe('reembolso × ativação: regressões complementares ao PR #94', () => {
  teste('controle: reembolso confirmado antes da leitura recusa o serial sem efeitos de ativação', async () => {
    const c = await cenario();
    await c.reembolsar();
    const r = await c.ativar();
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ erro: 'serial_invalido' });
    expect(c.db.sql('SELECT * FROM installations')).toHaveLength(0);
    expect(c.db.sql('SELECT * FROM trials')).toHaveLength(0);
    esperarRevogacao(c);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  teste('reembolso entre leitura do serial e gravação não concede licença nem cria trial/aparelho', async () => {
    const c = await cenario();
    const r = await reembolsarDuranteAtivacao(c);
    const corpo: any = await r.json();
    // A ausência de efeitos é verificada mesmo quando a resposta for 402/403.
    expect(c.db.sql('SELECT * FROM trials')).toHaveLength(0);
    expect(c.db.sql('SELECT * FROM installations')).toHaveLength(0);
    expect((c.db.sql('SELECT used_at FROM activation_codes')[0] as any).used_at).toBeNull();
    expect([402, 403]).toContain(r.status);
    expect(corpo.licenca).toBeUndefined();
    esperarRevogacao(c);
  });

  teste('trial já expirado não permite efeitos parciais da ativação atravessada pelo reembolso', async () => {
    const c = await cenario();
    c.db.sql(`INSERT INTO trials (account_id, started_at, expires_at, photo_limit, created_at, updated_at)
      VALUES (?, '2020-01-01T00:00:00.000Z', '2020-01-08T00:00:00.000Z', 2,
      '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z')`, c.direito.account_id);
    const antes = c.db.sql('SELECT * FROM trials');
    const r = await reembolsarDuranteAtivacao(c);
    expect([402, 403]).toContain(r.status);
    expect((await r.json() as any).licenca).toBeUndefined();
    expect(c.db.sql('SELECT * FROM trials')).toEqual(antes);
    expect(c.db.sql('SELECT * FROM installations')).toHaveLength(0);
    expect((c.db.sql('SELECT used_at FROM activation_codes')[0] as any).used_at).toBeNull();
    esperarRevogacao(c);
  });

  teste('ativação paga concluída antes do reembolso não ganha trial implícito nem mantém acesso sem outro direito', async () => {
    const c = await cenario();
    const r = await c.ativar();
    expect(r.status).toBe(200);
    const corpo: any = await r.json();
    expect((await validarLicenca(c.env, corpo.licenca, APARELHO)).ok).toBe(true);
    await c.reembolsar();
    const acesso = await validarLicenca(c.env, corpo.licenca, APARELHO);
    expect(acesso.ok).toBe(false);
    expect(c.db.sql('SELECT * FROM trials')).toHaveLength(0);
    esperarRevogacao(c);
  });

  teste('outra assinatura ativa não autoriza o código reembolsado e permanece intacta', async () => {
    const c = await cenario();
    const agora = new Date().toISOString();
    const fim = new Date(Date.now() + 365 * 86400000).toISOString();
    c.db.sql(`INSERT INTO entitlements
      (id, account_id, plan, status, photo_limit, current_period_end, last_payment_id, created_at, updated_at)
      VALUES ('outro-direito', ?, 'annual', 'active', 100, ?, 'OUTRA-COMPRA', ?, ?)`,
    c.direito.account_id, fim, agora, agora);
    const antes = c.db.sql("SELECT * FROM entitlements WHERE id = 'outro-direito'");
    const r = await reembolsarDuranteAtivacao(c);
    expect(c.db.sql("SELECT * FROM entitlements WHERE id = 'outro-direito'")).toEqual(antes);
    expect((c.db.sql('SELECT status FROM entitlements WHERE id = ?', c.direito.id)[0] as any).status).toBe('revoked');
    expect([402, 403]).toContain(r.status);
    expect((await r.json() as any).licenca).toBeUndefined();
    expect(c.db.sql('SELECT * FROM installations')).toHaveLength(0);
    expect(c.db.sql('SELECT * FROM trials')).toHaveLength(0);
  });
});
