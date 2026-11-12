import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import worker from '../worker/src/index';
import { processarPagamento } from '../worker/src/pagamentos';
import { temSqlite } from '../test-utils/d1';

// Worker e pagamentos reais, duas conexões independentes ao MESMO arquivo SQLite.
// Não é teste de Cloudflare D1, rede, entrega WhatsApp ou múltiplos processos.
const teste = temSqlite ? test : test.skip;
const DEVICE = '00000000-0000-4000-8000-000000000101';
const COMMIT_ORIGEM = '68d0898';

type Args = any[];
function adaptar(banco: any) {
  function preparar(sql: string, args: Args = []) {
    return {
      sql,
      args,
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
      } catch (error) {
        banco.exec('ROLLBACK');
        throw error;
      }
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
    // Schema completo do repositório, não schema mínimo transcrito.
    const migrations = path.join(process.cwd(), 'worker', 'migrations');
    for (const nome of fs.readdirSync(migrations).filter((n) => n.endsWith('.sql')).sort()) {
      a.exec(fs.readFileSync(path.join(migrations, nome), 'utf8'));
    }
    b = new sqlite.DatabaseSync(arquivo);
    b.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=1000');
    const dbA = adaptar(a);
    const dbB = adaptar(b);
    return {
      dbA, dbB,
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

function barreiraDeLeitura(db: ReturnType<typeof adaptar>) {
  const original = db.prepare;
  let anunciar!: () => void;
  let liberar!: () => void;
  let timer: ReturnType<typeof setTimeout>;
  let interceptou = false;
  const entrou = new Promise<void>((resolve, reject) => {
    anunciar = resolve;
    timer = setTimeout(() => reject(new Error('Consulta de ativação não atingiu a barreira em 2s')), 2000);
  });
  const liberada = new Promise<void>((resolve) => { liberar = resolve; });
  db.prepare = ((sql: string) => {
    const stmt = original(sql);
    if (!/FROM\s+activation_codes\s+c\s+JOIN\s+accounts\s+a/i.test(sql)) return stmt;
    const envolver = (s: any): any => ({
      ...s,
      bind: (...args: Args) => envolver(s.bind(...args)),
      async first() {
        // Consulta materializada e concluída: nenhuma transação de leitura fica aberta.
        const linha = await s.first();
        if (!interceptou) {
          interceptou = true;
          clearTimeout(timer);
          anunciar();
          await liberada;
        }
        return linha;
      },
    });
    return envolver(stmt);
  }) as typeof db.prepare;
  return {
    entrou,
    fechar() { clearTimeout(timer); liberar(); db.prepare = original; },
  };
}

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(async () => {
    throw new Error('Rede proibida na integração SQLite');
  });
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); });

describe(`integração duas conexões: reembolso × ativação (origem ${COMMIT_ORIGEM})`, () => {
  for (const variante of ['sem_trial', 'trial_expirado', 'outra_assinatura'] as const) {
    teste(`${variante}: reembolso em B após leitura em A impede efeitos da ativação`, async () => {
      const par = abrirPar();
      let barreira: ReturnType<typeof barreiraDeLeitura> | undefined;
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
        // Comprova visibilidade entre conexões distintas antes da corrida.
        expect(par.dbB.sql('SELECT id FROM entitlements WHERE id=?', direito.id)).toHaveLength(1);
        barreira = barreiraDeLeitura(par.dbA);
        pendente = worker.fetch(new Request('https://worker.test/v1/ativar', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.101' },
          body: JSON.stringify({ serial, instalacao: DEVICE }),
        }), envA);
        await barreira.entrou;
        const refund = await processarPagamento(envB, 'hotmart', 'reverted', dados, { fixture: true });
        expect(refund.status).toBe(200);
        expect(await refund.json()).toMatchObject({ revogado: true });
        // B já confirmou e A observa a revogação ANTES de retomar a leitura antiga.
        expect(par.dbA.sql('SELECT status FROM entitlements WHERE id=?', direito.id)[0]).toMatchObject({ status: 'revoked' });
        expect((par.dbA.sql('SELECT invalidated_at FROM activation_codes')[0] as any).invalidated_at).not.toBeNull();
        barreira.fechar();
        const resposta = await pendente;
        const corpo: any = await resposta.json();
        // Coleta todas as divergências em uma asserção para facilitar diagnóstico no CI.
        expect({
          statusRecusado: [402, 403].includes(resposta.status),
          temLicenca: typeof corpo.licenca === 'string',
          aparelhos: par.dbA.sql('SELECT * FROM installations').length,
          trials: par.dbA.sql('SELECT * FROM trials'),
          usado: (par.dbA.sql('SELECT used_at FROM activation_codes')[0] as any).used_at,
          outra: par.dbA.sql("SELECT * FROM entitlements WHERE id='outra'"),
        }).toEqual({
          statusRecusado: true, temLicenca: false, aparelhos: 0,
          trials: trialsAntes, usado: null, outra: outraAntes,
        });
        expect(global.fetch).not.toHaveBeenCalled();
      } finally {
        barreira?.fechar();
        if (pendente) await Promise.allSettled([pendente]);
        par.fechar();
      }
    }, 15000);
  }
});
