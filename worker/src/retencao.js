/**
 * Prazos de retenção do servidor, no mesmo texto de PRIVACIDADE.md (seção 8):
 * conversas não concluídas, cerca de 3 dias; contadores técnicos, cerca de 31 dias.
 * Os demais prazos são técnicos (registros de mensagens e fila de lembretes).
 *
 * Roda pelo cron do Worker (wrangler.toml [triggers]), uma vez por dia. Antes era um sorteio por
 * mensagem, que não garantia prazo nenhum: uma conversa podia ficar guardada por tempo indefinido.
 */
const UM_DIA_MS = 24 * 3600 * 1000;

export const PRAZOS = {
  conversaDias: 3,
  contadorDias: 31,
  processadoDias: 30,
  filaDias: 14,
};

/**
 * Apaga o que passou do prazo. Cada tabela é independente: uma falha em uma não impede as outras.
 * Devolve quantas linhas saíram por tabela, e os nomes das tabelas que falharam.
 */
export async function limparVencidos(env, agora = Date.now()) {
  const db = env.LEVIA_DB;
  const resultado = { removidos: {}, falhas: [] };
  if (!db) return resultado;
  const iso = (dias) => new Date(agora - dias * UM_DIA_MS).toISOString();
  const passos = [
    ['wa_sessions', 'DELETE FROM wa_sessions WHERE updated_at < ?', [iso(PRAZOS.conversaDias)]],
    ['wa_processed', 'DELETE FROM wa_processed WHERE created_at < ?', [iso(PRAZOS.processadoDias)]],
    ['cotas_uso', 'DELETE FROM cotas_uso WHERE ts < ?', [agora - PRAZOS.contadorDias * UM_DIA_MS]],
    // a fila guarda tempos em milissegundos (INTEGER), não texto
    ['wa_outbox', 'DELETE FROM wa_outbox WHERE criado_em < ?', [agora - PRAZOS.filaDias * UM_DIA_MS]],
  ];
  for (const [tabela, sql, args] of passos) {
    try {
      const r = await db.prepare(sql).bind(...args).run();
      resultado.removidos[tabela] = r?.meta?.changes ?? 0;
    } catch (e) {
      resultado.falhas.push(tabela);
      console.error(`retenção (${tabela}):`, e?.message);
    }
  }
  return resultado;
}
