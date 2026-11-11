/**
 * Lembretes do atendimento por WhatsApp. Quando o LEVI faz uma pergunta e a pessoa não responde,
 * o Worker agenda: um toque aos 30 s, outro aos 3 min e um no dia seguinte às 19:00 (no fuso do
 * país do número). Qualquer mensagem da pessoa cancela o que estiver pendente. Depois do último
 * lembrete não se escreve mais. Quem entrega é o gateway, que busca a fila (puxarVencidos).
 */
const UM_DIA_MS = 24 * 3600 * 1000;
const PRIMEIRO_TOQUE_MS = 30 * 1000;
const SEGUNDO_TOQUE_MS = 3 * 60 * 1000;
const HORA_DO_DIA_SEGUINTE = 19;

// prefixo do país (do maior para o menor) → fuso. Sem correspondência: horário de Brasília.
const FUSOS = [
  ['351', 'Europe/Lisbon'], ['353', 'Europe/Dublin'], ['356', 'Europe/Malta'], ['352', 'Europe/Luxembourg'],
  ['34', 'Europe/Madrid'], ['33', 'Europe/Paris'], ['39', 'Europe/Rome'], ['49', 'Europe/Berlin'],
  ['44', 'Europe/London'], ['31', 'Europe/Amsterdam'], ['32', 'Europe/Brussels'], ['41', 'Europe/Zurich'],
  ['43', 'Europe/Vienna'], ['30', 'Europe/Athens'], ['46', 'Europe/Stockholm'], ['45', 'Europe/Copenhagen'],
  ['47', 'Europe/Oslo'], ['48', 'Europe/Warsaw'], ['55', 'America/Sao_Paulo'], ['54', 'America/Argentina/Buenos_Aires'],
  ['1', 'America/New_York'],
];

export function fusoDoTelefone(digitos) {
  const d = String(digitos).replace(/\D/g, '');
  for (const [prefixo, fuso] of FUSOS) if (d.startsWith(prefixo)) return fuso;
  return 'America/Sao_Paulo';
}

/** Diferença (ms) entre o relógio local do fuso e o UTC num instante: local = utc + deslocamento. */
function deslocamento(fuso, utcMs) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: fuso, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]),
  );
  const comoUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return comoUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Instante (ms UTC) das 19:00 do dia seguinte no fuso, a contar de `agora`. */
export function diaSeguinteAs19(agora, fuso) {
  const local = new Date(agora + deslocamento(fuso, agora));
  const alvoComoUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1, HORA_DO_DIA_SEGUINTE, 0, 0);
  let utc = alvoComoUtc - deslocamento(fuso, alvoComoUtc);
  utc = alvoComoUtc - deslocamento(fuso, utc); // segunda passada: vira o horário de verão no meio do caminho
  return utc;
}

/** O banco de lembretes pode ainda não existir (migration 0006): nunca derruba a conversa. */
async function tentar(fn) {
  try { return await fn(); } catch (e) { console.error('lembretes:', e?.message); return null; }
}

export async function cancelarLembretes(env, phone, agora = Date.now()) {
  if (!env.LEVIA_DB) return;
  await tentar(() => env.LEVIA_DB.prepare(
    // os avisos para a equipe (id 'aviso-…' e 'alerta-…') e o serial de uma compra (id 'pgto-…') não são lembretes de
    // cliente: nunca se cancelam por mensagem recebida (quem acabou de pagar costuma escrever ao bot na hora)
    "UPDATE wa_outbox SET cancelado_em = ? WHERE phone = ? AND enviado_em IS NULL AND cancelado_em IS NULL AND id NOT LIKE 'aviso-%' AND id NOT LIKE 'alerta-%' AND id NOT LIKE 'pgto-%'",
  ).bind(agora, phone).run());
}

/**
 * Agenda os três lembretes da pergunta atual (cancelando os anteriores).
 * toques = { primeiro, segundo, diaSeguinte }: textos já prontos.
 */
export async function agendarLembretes(env, phone, toques, agora = Date.now()) {
  if (!env.LEVIA_DB) return;
  await cancelarLembretes(env, phone, agora);
  const fuso = fusoDoTelefone(phone);
  const itens = [
    [agora + PRIMEIRO_TOQUE_MS, toques.primeiro],
    [agora + SEGUNDO_TOQUE_MS, toques.segundo],
    [diaSeguinteAs19(agora, fuso), toques.diaSeguinte],
  ];
  for (const [quando, toque] of itens) {
    // com mídia o texto vira JSON ({ texto, midia }): evita uma coluna nova no banco
    const texto = typeof toque === 'string' ? toque : JSON.stringify(toque);
    await tentar(() => env.LEVIA_DB.prepare(
      'INSERT INTO wa_outbox (id, phone, texto, enviar_em, criado_em) VALUES (?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), phone, texto, quando, agora).run());
  }
}

/** O texto gravado é puro ou um JSON { texto, midia }. */
function lerToque(gravado) {
  if (typeof gravado === 'string' && gravado.startsWith('{"')) {
    try {
      const { texto, midia } = JSON.parse(gravado);
      if (typeof texto === 'string') return { texto, midia: typeof midia === 'string' ? midia : undefined };
    } catch { /* texto que só parece JSON */ }
  }
  return { texto: gravado, midia: undefined };
}

/**
 * Entrega ao gateway o que já venceu e marca como enviado (no máximo uma vez). Só sai lembrete de
 * quem ainda tem a conversa aberta; limpa de vez em quando o que é antigo.
 */
export async function puxarVencidos(env, agora = Date.now(), limite = 10) {
  if (!env.LEVIA_DB) return [];
  const linhas = await tentar(async () => {
    const r = await env.LEVIA_DB.prepare(
      `SELECT o.id, o.phone, o.texto FROM wa_outbox o
       WHERE o.enviado_em IS NULL AND o.cancelado_em IS NULL AND o.enviar_em <= ?1
         AND (o.id LIKE 'aviso-%' OR o.id LIKE 'pgto-%' OR o.id LIKE 'alerta-%' OR EXISTS (SELECT 1 FROM wa_sessions s WHERE s.phone = o.phone))
       ORDER BY o.enviar_em LIMIT ?2`,
    ).bind(agora, limite).all();
    return r.results ?? [];
  });
  if (!linhas || linhas.length === 0) return [];
  const entregues = [];
  for (const l of linhas) {
    // a marcação é condicional: dois pedidos simultâneos não entregam o mesmo lembrete duas vezes
    const marcou = await tentar(() => env.LEVIA_DB.prepare(
      'UPDATE wa_outbox SET enviado_em = ? WHERE id = ? AND enviado_em IS NULL AND cancelado_em IS NULL',
    ).bind(agora, l.id).run());
    if (marcou?.meta?.changes === 1) {
      const { texto, midia } = lerToque(l.texto);
      entregues.push({ id: l.id, telefone: l.phone.replace(/\D/g, ''), texto, midia });
    }
  }
  return entregues;
}
