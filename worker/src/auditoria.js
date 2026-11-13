/**
 * Retenção da auditoria administrativa: apaga de admin_auditoria o que passou do prazo.
 *
 * Prazo configurável em dias por AUDITORIA_RETENCAO_DIAS (variável do Worker); sem ela ou com
 * valor inválido, vale 180 dias. Roda no cron diário (ver `scheduled` em src/index.js) e apaga
 * em lotes de 500 para não segurar a transação nem estourar o tempo da execução.
 */
export const RETENCAO_PADRAO_DIAS = 180;
const RETENCAO_MAX_DIAS = 3650;
const LOTE = 500;
const TETO_POR_EXECUCAO = 50_000;
const DIA_MS = 24 * 60 * 60 * 1000;

/** Lê o prazo em dias do ambiente, sempre entre 1 e 3650 (padrão 180). */
export function diasDeRetencao(env) {
  const bruto = Number(env?.AUDITORIA_RETENCAO_DIAS);
  if (!Number.isFinite(bruto) || bruto < 1) return RETENCAO_PADRAO_DIAS;
  return Math.min(Math.floor(bruto), RETENCAO_MAX_DIAS);
}

/**
 * Remove os registros mais antigos que o prazo e devolve quantos saíram.
 * Sem D1 configurado não faz nada (a auditoria já é opcional nas rotas).
 */
export async function limparAuditoriaAntiga(env, { agora = Date.now(), dias } = {}) {
  const db = env?.LEVIA_DB;
  const prazo = dias ?? diasDeRetencao(env);
  if (!db) return { removidos: 0, dias: prazo, ignorado: 'sem_d1' };

  const limite = agora - prazo * DIA_MS;
  let removidos = 0;
  try {
    for (;;) {
      const r = await db.prepare(
        'DELETE FROM admin_auditoria WHERE id IN (SELECT id FROM admin_auditoria WHERE criado_em < ? LIMIT ?)',
      ).bind(limite, LOTE).run();
      const n = Number(r?.meta?.changes ?? 0);
      removidos += n;
      if (n < LOTE || removidos >= TETO_POR_EXECUCAO) break;
    }
  } catch (e) {
    console.error('auditoria retencao: falha', e?.message);
    return { removidos, dias: prazo, erro: 'd1' };
  }
  return { removidos, dias: prazo };
}
