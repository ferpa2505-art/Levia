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
 * Reserva uma unidade em cada escopo { nome, chave, limite, janelaMs }. Se um estoura,
 * nenhuma reserva fica. Devolve { ok:true } ou { ok:false, escopo }.
 */
export async function reservarEscopos(env, escopos, agora = Date.now()) {
  return env.LEVIA_DB ? reservarNoD1(env.LEVIA_DB, escopos, agora) : reservarNoKv(env.LEVIA_COTAS, escopos, agora);
}

async function usoDoEscopo(env, escopo, agora) {
  if (env.LEVIA_DB) {
    const linha = await env.LEVIA_DB.prepare('SELECT COUNT(*) AS n, MIN(ts) AS primeiro FROM cotas_uso WHERE chave = ?1 AND ts > ?2')
      .bind(escopo.chave, agora - escopo.janelaMs).first();
    return { n: Number(linha?.n ?? 0), primeiro: Number(linha?.primeiro ?? agora) };
  }
  const lista = ((await env.LEVIA_COTAS.get(escopo.chave, 'json')) ?? []).filter((t) => agora - t < escopo.janelaMs);
  return { n: lista.length, primeiro: lista.length ? Math.min(...lista) : agora };
}

/**
 * Reserva uma foto nos três limites: o do titular (conta do serial; ou, sem conta, a instalação
 * por 7 dias), o do IP por hora e o do serviço em 24 h.
 * `conta` = { id, limite, janelaMs } vem da licença validada.
 * Devolve { ok:true, restantes } ou { ok:false, status, corpo } pronto para responder.
 */
export async function reservarCotaFoto(env, { instalacao, ip, conta, agora = Date.now() }) {
  const titular = conta
    ? { nome: 'inst', chave: `conta:${conta.id}`, limite: Number(conta.limite), janelaMs: Number(conta.janelaMs) }
    : { nome: 'inst', chave: `inst:${instalacao}`, limite: Number(env.FOTOS_GRATIS_7D || 2), janelaMs: SETE_DIAS_MS };
  const escopos = [
    titular,
    { nome: 'ip', chave: `ip:${ip}`, limite: Number(env.MAX_FOTOS_IP_HORA || 20), janelaMs: UMA_HORA_MS },
    { nome: 'dia', chave: 'dia:global', limite: Number(env.MAX_FOTOS_DIA || 300), janelaMs: UM_DIA_MS },
  ];
  const r = await reservarEscopos(env, escopos, agora);
  if (r.ok) {
    const { n } = await usoDoEscopo(env, titular, agora);
    return { ok: true, restantes: Math.max(0, titular.limite - n) };
  }
  if (r.escopo.nome === 'dia') return { ok: false, status: 429, corpo: { erro: 'limite_servico' } };
  if (r.escopo.nome === 'ip') return { ok: false, status: 429, corpo: { erro: 'muitas_tentativas' } };
  const { primeiro } = await usoDoEscopo(env, titular, agora);
  return {
    ok: false,
    status: 402,
    corpo: { erro: 'cota_esgotada', limite: titular.limite, liberaEm: new Date(primeiro + titular.janelaMs).toISOString() },
  };
}
