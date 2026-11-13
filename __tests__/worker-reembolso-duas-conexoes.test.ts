import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import worker from '../worker/src/index';
import { processarPagamento } from '../worker/src/pagamentos';
import { temSqlite } from '../test-utils/d1';
import { pausarLeituraCodigo } from '../test-utils/barreira-ativacao';

// Worker real, duas conexões ao mesmo arquivo SQLite. Não é D1 remoto.
const teste = temSqlite ? test : test.skip;
const DEVICE = '00000000-0000-4000-8000-000000000101';
type Args = any[];
function adaptar(banco: any) {
  function preparar(sql: string, args: Args = []) {
    return {
      sql, args,
      bind(...valores: Args): any { return preparar(sql, valores); },
      async first() { return banco.prepare(sql).get(...args) ?? null; },
      async all() { return { results: banco.prepare(sql).all(...args) }; },
      async run() {
        const r = banco.prepare(sql).run(...args);
        return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
      },
    };
  }
  return {
    prepare: (sql: string) => preparar(sql),
    async batch(stmts: any[]) {
      banco.exec('BEGIN');
      try {
        const results = [];
        for (const stmt of stmts) results.push(await stmt.run());
        banco.exec('COMMIT');
        return results;
      } catch (error) { banco.exec('ROLLBACK'); throw error; }
    },
    sql(sql: string, ...args: Args) { return banco.prepare(sql).all(...args); },
  };
}
function abrirPar() {
  const sqlite = (process as any).getBuiltinModule('node:sqlite');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'levia-race-'));
  const arquivo = path.join(dir, 'shared.sqlite');
  let a: any;
  let b: any;
  try {
    a = new sqlite.DatabaseSync(arquivo);
    a.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=1000');
    const migrations = path.join(process.cwd(), 'worker', 'migrations');
    for (const nome of fs.readdirSync(migrations).filter((n) => n.endsWith('.sql')).sort()) {
      a.exec(fs.readFileSync(path.join(migrations, nome), 'utf8'));
    }
    b = new sqlite.DatabaseSync(arquivo);
    b.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=1000');
    return {
      dbA: adaptar(a), dbB: adaptar(b),
      fechar() {
        try { b.close(); } finally {
          try { a.close(); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
        }
      },
    };
  } catch (error) {
    try { b?.close(); } finally {
      try { a?.close(); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    }
    throw error;
  }
}
beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(async () => { throw new Error('Rede proibida na integração SQLite'); });
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); });

describe('integração duas conexões: reembolso × ativação', () => {
  for (const variante of ['sem_trial', 'trial_expirado', 'outra_assinatura'] as const) {
    teste(`${variante}: reembolso em B após leitura em A impede efeitos da ativação`, async () => {
      const par = abrirPar();
      let barreira: ReturnType<typeof pausarLeituraCodigo> | undefined;
      let pendente: Promise<Response> | undefined;
      try {
        const chaves = {
          LICENCA_TOKEN_KEY: 'fixture-licenca', TYPEBOT_PHONE_HMAC_KEY: 'fixture-telefone',
          EMAIL_HASH_KEY: 'fixture-email', FOTOS_GRATIS_7D: '2',
        };
        const envA: any = { ...chaves, LEVIA_DB: par.dbA };
        const envB: any = { ...chaves, LEVIA_DB: par.dbB };
        const dados = { idEvento: 'COMPRA-TESTE-101', telefone: '+5511900000099', produtos: ['mensal'], valorCentavos: 1997 };
        const paid = await processarPagamento(envA, 'hotmart', 'paid', dados, { fixture: true });
        expect(paid.status).toBe(200);
        expect(await paid.json()).toMatchObject({ plano: 'monthly' });
        const direito: any = par.dbA.sql('SELECT * FROM entitlements')[0];
        const serial = par.dbA.sql('SELECT texto FROM wa_outbox').map((r: any) => r.texto)
          .find((s: string) => /^[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}$/.test(s));
        expect(serial).toBeDefined();
        if (variante === 'trial_expirado') {
          par.dbA.sql(`INSERT INTO trials(account_id,started_at,expires_at,created_at,updated_at)
            VALUES(?,'2020-01-01','2020-01-08','2020-01-01','2020-01-01')`, direito.account_id);
        }
        if (variante === 'outra_assinatura') {
          const iso = new Date().toISOString();
          par.dbA.sql(`INSERT INTO entitlements(id,account_id,plan,status,photo_limit,current_period_end,last_payment_id,created_at,updated_at)
            VALUES('outra',?,'annual','active',100,?,'OUTRA-COMPRA',?,?)`,
          direito.account_id, new Date(Date.now() + 365 * 86400000).toISOString(), iso, iso);
        }
        const trialsAntes = par.dbA.sql('SELECT * FROM trials');
        const outraAntes = par.dbA.sql("SELECT * FROM entitlements WHERE id='outra'");
        expect(par.dbB.sql('SELECT id FROM entitlements WHERE id=?', direito.id)).toHaveLength(1);
        barreira = pausarLeituraCodigo(par.dbA);
        pendente = worker.fetch(new Request('https://worker.test/v1/ativar', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.101' },
          body: JSON.stringify({ serial, instalacao: DEVICE }),
        }), envA);
        void pendente.catch(() => {});
        await barreira.entrada;
        const refund = await processarPagamento(envB, 'hotmart', 'reverted', dados, { fixture: true });
        expect(refund.status).toBe(200);
        expect(await refund.json()).toMatchObject({ revogado: true });
        expect(par.dbA.sql('SELECT status FROM entitlements WHERE id=?', direito.id)[0]).toMatchObject({ status: 'revoked' });
        expect((par.dbA.sql('SELECT invalidated_at FROM activation_codes')[0] as any).invalidated_at).not.toBeNull();
        barreira.fechar();
        const resposta = await pendente;
        const corpo: any = await resposta.json();
        expect({
          statusRecusado: [402, 403].includes(resposta.status), temLicenca: typeof corpo.licenca === 'string',
          aparelhos: par.dbA.sql('SELECT * FROM installations').length, trials: par.dbA.sql('SELECT * FROM trials'),
          usado: (par.dbA.sql('SELECT used_at FROM activation_codes')[0] as any).used_at,
          outra: par.dbA.sql("SELECT * FROM entitlements WHERE id='outra'"),
        }).toEqual({ statusRecusado: true, temLicenca: false, aparelhos: 0, trials: trialsAntes, usado: null, outra: outraAntes });
        expect(global.fetch).not.toHaveBeenCalled();
      } finally {
        barreira?.fechar();
        if (pendente) await Promise.allSettled([pendente]);
        par.fechar();
      }
    }, 15000);
  }
});
