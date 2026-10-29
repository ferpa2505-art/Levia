const UM_DIA_MS = 24 * 3600 * 1000;
const UMA_HORA_MS = 3600 * 1000;
const SETE_DIAS_MS = 7 * UM_DIA_MS;

/**
 * Cada reserva é UM comando SQL que só insere se a contagem na janela ainda
 * estiver abaixo do limite. O SQLite executa o comando inteiro de forma
 * atômica, então duas requisições paralelas não passam juntas do limite.
 */
const RESERVAR = `INSERT INTO cotas_uso (chave, ts)
  SELECT ?1, ?2 WHERE (SELECT COUNT(*) FROM cotas_uso WHERE chave = ?1 AND ts > ?3) < ?4`;

async function reservarNoD1(db, escopos, agora) {
  const feitas = [];
  for (const e of escopos) {
    const r = await db.prepare(RESERVAR).bind(e.chave, agora, agora - e.janelaMs, e.limite).run();
    if (r?.meta?.changes === 1) {
      feitas.push(r.meta.last_row_id);
      continue;
    }
    // desfaz as reservas já feitas neste pedido
    for (const id of feitas) await db.prepare('DELETE FROM cotas_uso WHERE id = ?').bind(id).run();
    return { ok: false, escopo: e };
  }
  if (Math.random() < 0.05) await db.prepare('DELETE FROM cotas_uso WHERE ts < ?').bind(agora - 8 * UM_DIA_MS).run();
  return { ok: true };
}

/** Plano B (sem D1): contadores no KV. NÃO é atômico — use só em desenvolvimento. */
async function reservarNoKv(kv, escopos, agora) {
  for (const e of escopos) {
    const lista = ((await kv.get(e.chave, 'json')) ?? []).filter((t) => agora - t < e.janelaMs);
    if (lista.length >= e.limite) return { ok: false, escopo: e };
  }
  for (const e of escopos) {
    const lista = ((await kv.get(e.chave, 'json')) ?? []).filter((t) => agora - t < e.janelaMs);
    lista.push(agora);
    await kv.put(e.chave, JSON.stringify(lista), { expirationTtl: Math.ceil(e.janelaMs / 1000) + 3600 });
  }
  return { ok: true };
}

/**
 * Reserva uma foto nos três limites (instalação 7 dias, IP 1 hora, serviço 24 h).
 * Devolve { ok:true, restantes } ou { ok:false, status, corpo } pronto para responder.
 */
export async function reservarCotaFoto(env, { instalacao, ip, agora = Date.now() }) {
  const limiteInst = Number(env.FOTOS_GRATIS_7D || 2);
  const escopos = [
    { nome: 'inst', chave: `inst:${instalacao}`, limite: limiteInst, janelaMs: SETE_DIAS_MS },
    { nome: 'ip', chave: `ip:${ip}`, limite: Number(env.MAX_FOTOS_IP_HORA || 20), janelaMs: UMA_HORA_MS },
    { nome: 'dia', chave: 'dia:global', limite: Number(env.MAX_FOTOS_DIA || 300), janelaMs: UM_DIA_MS },
  ];
  const r = env.LEVIA_DB ? await reservarNoD1(env.LEVIA_DB, escopos, agora) : await reservarNoKv(env.LEVIA_COTAS, escopos, agora);
  if (r.ok) {
    let usadas = 1;
    if (env.LEVIA_DB) {
      const linha = await env.LEVIA_DB.prepare('SELECT COUNT(*) AS n FROM cotas_uso WHERE chave = ?1 AND ts > ?2')
        .bind(escopos[0].chave, agora - SETE_DIAS_MS).first();
      usadas = Number(linha?.n ?? 1);
    } else {
      usadas = ((await env.LEVIA_COTAS.get(escopos[0].chave, 'json')) ?? []).length;
    }
    return { ok: true, restantes: Math.max(0, limiteInst - usadas) };
  }
  if (r.escopo.nome === 'dia') return { ok: false, status: 429, corpo: { erro: 'limite_servico' } };
  if (r.escopo.nome === 'ip') return { ok: false, status: 429, corpo: { erro: 'muitas_tentativas' } };
  let primeiro = agora;
  if (env.LEVIA_DB) {
    const linha = await env.LEVIA_DB.prepare('SELECT MIN(ts) AS t FROM cotas_uso WHERE chave = ?1 AND ts > ?2')
      .bind(escopos[0].chave, agora - SETE_DIAS_MS).first();
    primeiro = Number(linha?.t ?? agora);
  } else {
    primeiro = Math.min(...(((await env.LEVIA_COTAS.get(escopos[0].chave, 'json')) ?? [agora])));
  }
  return { ok: false, status: 402, corpo: { erro: 'cota_esgotada', limite: limiteInst, liberaEm: new Date(primeiro + SETE_DIAS_MS).toISOString() } };
}
