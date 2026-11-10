import fs from 'node:fs';
import path from 'node:path';

/**
 * D1 de teste: SQLite de verdade (node:sqlite, Node 22.13+) com as migrations do Worker.
 * Devolve null quando o Node não tem node:sqlite (os testes que dependem dele são pulados).
 * A ordem é a mesma do wrangler (lexicográfica): as duas 0003 entram, e a 0003_add_lead_columns
 * é um no-op porque a 0002 já cria as colunas.
 */
const MIGRATIONS = [
  '0001_initial', '0002_leads', '0003_add_lead_columns', '0003_whatsapp',
  '0004_whatsapp_tables', '0005_cotas_uso', '0006_wa_outbox', '0007_payment_payload',
];

type Argumentos = unknown[];

export const temSqlite = !!(process as unknown as { getBuiltinModule?: (n: string) => unknown }).getBuiltinModule?.('node:sqlite');

export function criarD1() {
  const sqlite = (process as unknown as { getBuiltinModule: (n: string) => any }).getBuiltinModule('node:sqlite');
  const banco = new sqlite.DatabaseSync(':memory:');
  banco.exec('PRAGMA foreign_keys = ON');
  for (const nome of MIGRATIONS) {
    banco.exec(fs.readFileSync(path.join(process.cwd(), 'worker', 'migrations', `${nome}.sql`), 'utf8'));
  }

  function preparar(sql: string, args: Argumentos = []) {
    const api = {
      sql,
      args,
      bind(...novos: Argumentos) { return preparar(sql, novos); },
      async run() {
        const r = banco.prepare(sql).run(...args);
        return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
      },
      async first() { return banco.prepare(sql).get(...args) ?? null; },
      async all() { return { results: banco.prepare(sql).all(...args) }; },
    };
    return api;
  }

  return {
    prepare: (sql: string) => preparar(sql),
    // como no D1, o lote é uma transação: ou tudo, ou nada
    async batch(comandos: ReturnType<typeof preparar>[]) {
      banco.exec('BEGIN');
      try {
        const saidas = [];
        for (const c of comandos) saidas.push(await c.run());
        banco.exec('COMMIT');
        return saidas;
      } catch (erro) {
        banco.exec('ROLLBACK');
        throw erro;
      }
    },
    /** só para os testes mexerem direto nos dados (vencer o teste, bloquear conta…) */
    sql: (comando: string, ...args: Argumentos) => banco.prepare(comando).all(...args),
  };
}
