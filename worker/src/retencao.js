import { alertarPagamentosPresos } from './alertaFila';
import { hmacHex } from './cripto';

/**
 * Prazos de retenção do servidor, no mesmo texto de PRIVACIDADE.md (seção 8):
 * conversas não concluídas, cerca de 3 dias; contadores técnicos, cerca de 31 dias.
 * Os demais prazos são técnicos (registros de mensagens e fila de lembretes).
 *
 * Roda pelo cron do Worker (wrangler.toml [triggers]), uma vez por dia. Antes era um sorteio por
 * mensagem, que não garantia prazo nenhum: uma conversa podia ficar guardada por tempo indefinido.
 * Antes de apagar, confere se há entregas de pagamento presas e avisa a equipe (alertaFila.js).
 */
const UM_DIA_MS = 24 * 3600 * 1000;

export const PRAZOS = {
  conversaDias: 3,
  contadorDias: 31,
  processadoDias: 30,
  filaDias: 14,
  leadDias: 180,
};

// teto de leads examinados por execução do cron (cada um custa uma consulta ao D1)
const LOTE_LEADS = 200;

/**
 * Cadastros (leads) com mais de 180 dias SÓ são apagados quando a pessoa não tem plano ativo.
 * O telefone do lead está em texto e a conta guarda só o hash HMAC, então a checagem é feita lead por lead.
 * Falha para o lado seguro: sem a chave, com erro na consulta, conta que não está "active" ou direito
 * em estado incerto, o lead FICA. Nunca registra telefone nem e-mail.
 * Devolve { examinados, apagados, mantidos }.
 */
export async function limparLeadsAntigos(env, agora = Date.now()) {
  const r = { examinados: 0, apagados: 0, mantidos: 0 };
  const db = env.LEVIA_DB;
  if (!db || !env.TYPEBOT_PHONE_HMAC_KEY) return r;
  const corte = new Date(agora - PRAZOS.leadDias * UM_DIA_MS).toISOString();
  const iso = new Date(agora).toISOString();
  const { results } = await db.prepare(
    'SELECT id, phone FROM leads WHERE created_at < ? ORDER BY RANDOM() LIMIT ?',
  ).bind(corte, LOTE_LEADS).all();
  for (const lead of results ?? []) {
    r.examinados += 1;
    let apagar = false;
    try {
      const hash = await hmacHex(env.TYPEBOT_PHONE_HMAC_KEY, String(lead.phone));
      const conta = await db.prepare('SELECT id, status FROM accounts WHERE phone_hash = ?').bind(hash).first();
      if (!conta) {
        apagar = true; // nunca virou conta: só o cadastro de conversa
      } else if (conta.status === 'active') {
        const direito = await db.prepare(
          `SELECT 1 AS existe FROM entitlements
           WHERE account_id = ?1 AND status NOT IN ('revoked', 'expired', 'cancelled')
             AND (current_period_end IS NULL OR current_period_end > ?2)
           UNION ALL
           SELECT 1 FROM trials WHERE account_id = ?1 AND status = 'active' AND expires_at > ?2
           LIMIT 1`,
        ).bind(conta.id, iso).first();
        apagar = !direito;
      } // conta bloqueada, apagada ou em estado desconhecido: não apaga
      if (apagar) await db.prepare('DELETE FROM leads WHERE id = ?').bind(lead.id).run();
    } catch {
      apagar = false;
    }
    if (apagar) r.apagados += 1; else r.mantidos += 1;
  }
  return r;
}

/**
 * Apaga o que passou do prazo. Cada tabela é independente: uma falha em uma não impede as outras.
 * Devolve quantas linhas saíram por tabela, e os nomes das tabelas que falharam.
 */
export async function limparVencidos(env, agora = Date.now()) {
  const db = env.LEVIA_DB;
  const resultado = { removidos: {}, falhas: [] };
  if (!db) return resultado;
  // antes da limpeza: o que está preso precisa ser visto antes de a retenção de 14 dias apagar
  try {
    resultado.alertaFila = await alertarPagamentosPresos(env, agora);
  } catch (e) {
    console.error('retenção (alerta da fila):', e?.message);
  }
  const iso = (dias) => new Date(agora - dias * UM_DIA_MS).toISOString();
  const passos = [
    ['wa_sessions', 'DELETE FROM wa_sessions WHERE updated_at < ?', [iso(PRAZOS.conversaDias)]],
    ['wa_processed', 'DELETE FROM wa_processed WHERE created_at < ?', [iso(PRAZOS.processadoDias)]],
    ['cotas_uso', 'DELETE FROM cotas_uso WHERE ts < ?', [agora - PRAZOS.contadorDias * UM_DIA_MS]],
    // a fila guarda tempos em milissegundos (INTEGER), não texto
    ['wa_outbox', 'DELETE FROM wa_outbox WHERE criado_em < ?', [agora - PRAZOS.filaDias * UM_DIA_MS]],
    // histórico do alerta: mesmo prazo dos contadores técnicos (31 dias)
    ['alerta_envios', 'DELETE FROM alerta_envios WHERE criado_em < ?', [agora - PRAZOS.contadorDias * UM_DIA_MS]],
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
  try {
    resultado.removidos.leads = (await limparLeadsAntigos(env, agora)).apagados;
  } catch (e) {
    resultado.falhas.push('leads');
    console.error('retenção (leads):', e?.message);
  }
  return resultado;
}
