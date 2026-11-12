/**
 * Cliente da Pages API (Graph API v27.0) para ler a Página, publicar posts e consultar insights.
 *
 * Segurança: o token de Página vive só no Worker (secret FB_PAGE_TOKEN) e vai no header
 * Authorization, nunca na query string — assim não aparece em log de URL nem em histórico de proxy.
 * O ID da Página também vem do ambiente (FB_PAGE_ID), para o mesmo código servir teste e produção.
 * Se FB_APP_SECRET estiver definido (apps com "Exigir App Secret"), cada chamada leva o
 * appsecret_proof calculado a partir do token — o segredo do app não é enviado.
 *
 * Erro 190 (token inválido, expirado ou revogado) vira ErroTokenPagina: o chamador precisa pedir um
 * token novo, e não tratar como falha genérica e ficar repetindo a chamada para sempre.
 */

export const VERSAO_GRAPH = 'v27.0';

const BASE = 'https://graph.facebook.com';

export class ErroPagina extends Error {
  constructor(mensagem, { codigo = null, subcodigo = null, tipo = null, status = 0, traceId = null } = {}) {
    super(mensagem);
    this.name = 'ErroPagina';
    this.codigo = codigo;
    this.subcodigo = subcodigo;
    this.tipo = tipo;
    this.status = status;
    this.traceId = traceId;
  }
}

export class ErroTokenPagina extends ErroPagina {
  constructor(mensagem, detalhe = {}) {
    super(mensagem, detalhe);
    this.name = 'ErroTokenPagina';
  }
}

/** Verdadeiro quando o token da Página precisa ser trocado (erro 190 da Graph API). */
export function ehTokenInvalido(erro) {
  return erro instanceof ErroTokenPagina || Number(erro?.codigo) === 190;
}

/**
 * appsecret_proof: HMAC-SHA256 do access token usando o App Secret como chave (hex).
 * Apps com "Exigir App Secret" recusam chamadas sem essa prova; o segredo em si nunca sai daqui.
 */
export async function provaDoApp(token, segredo) {
  const chave = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const assinatura = await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(token));
  return [...new Uint8Array(assinatura)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function configuracao(env) {
  const pageId = String(env?.FB_PAGE_ID ?? '').trim();
  const token = String(env?.FB_PAGE_TOKEN ?? '').trim();
  if (!pageId || !token) {
    throw new ErroPagina('Pages API não configurada: defina FB_PAGE_ID e FB_PAGE_TOKEN', { codigo: 'nao_configurado' });
  }
  return { pageId, token };
}

function montarUrl(pageId, caminho, params) {
  const trilha = caminho ? (caminho.startsWith('/') ? caminho : `/${caminho}`) : '';
  const url = new URL(`${BASE}/${VERSAO_GRAPH}/${encodeURIComponent(pageId)}${trilha}`);
  for (const [chave, valor] of Object.entries(params ?? {})) {
    if (valor === undefined || valor === null || valor === '') continue;
    url.searchParams.set(chave, Array.isArray(valor) ? valor.join(',') : String(valor));
  }
  return url;
}

/**
 * Chamada crua à Página. GET manda os parâmetros na query; POST/DELETE mandam no corpo
 * form-encoded, que é o formato aceito pela Graph API.
 */
export async function chamarPagina(env, caminho, { metodo = 'GET', params = {}, corpo = {} } = {}) {
  const { pageId, token } = configuracao(env);
  const verbo = String(metodo).toUpperCase();
  const segredo = String(env?.FB_APP_SECRET ?? '').trim();
  const prova = segredo ? await provaDoApp(token, segredo) : null;
  const parametros = prova ? { ...params, appsecret_proof: prova } : params;
  const url = montarUrl(pageId, caminho, verbo === 'GET' ? parametros : {});
  const cabecalhos = { Authorization: `Bearer ${token}` };
  const init = { method: verbo, headers: cabecalhos };

  if (verbo !== 'GET') {
    const form = new URLSearchParams();
    for (const [chave, valor] of Object.entries({ ...parametros, ...corpo })) {
      if (valor === undefined || valor === null || valor === '') continue;
      form.set(chave, Array.isArray(valor) ? valor.join(',') : String(valor));
    }
    init.body = form;
    cabecalhos['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  const resposta = await fetch(url.toString(), init);

  let dados = null;
  try { dados = await resposta.json(); } catch { dados = null; }

  const erro = dados?.error;
  if (erro) {
    const detalhe = {
      codigo: erro.code ?? null,
      subcodigo: erro.error_subcode ?? null,
      tipo: erro.type ?? null,
      status: resposta.status,
      traceId: erro.fbtrace_id ?? null,
    };
    // log só com códigos: nunca o token, nunca o corpo do erro inteiro
    console.error('pages_api', detalhe.codigo ?? detalhe.status, detalhe.subcodigo ?? '-');
    const mensagem = `Pages API ${detalhe.codigo ?? detalhe.status}: ${erro.message ?? 'erro desconhecido'}`;
    throw Number(detalhe.codigo) === 190 ? new ErroTokenPagina(mensagem, detalhe) : new ErroPagina(mensagem, detalhe);
  }

  if (!resposta.ok) throw new ErroPagina(`Pages API HTTP ${resposta.status}`, { status: resposta.status });
  return dados;
}

/** Dados básicos da Página (id, nome, sobre, fãs). */
export async function obterPagina(env, campos = ['id', 'name', 'about', 'fan_count']) {
  return chamarPagina(env, '', { params: { fields: campos } });
}

/**
 * Publica no feed da Página. `publicado: false` agenda para `agendarPara` (timestamp Unix),
 * exigido pela Graph API nesse caso.
 */
export async function publicarPost(env, { mensagem, link, publicado = true, agendarPara } = {}) {
  if (typeof mensagem !== 'string' || !mensagem.trim()) {
    throw new ErroPagina('publicarPost exige uma mensagem', { codigo: 'parametro' });
  }
  if (!publicado && !agendarPara) {
    throw new ErroPagina('publicarPost com publicado:false exige agendarPara', { codigo: 'parametro' });
  }
  return chamarPagina(env, '/feed', {
    metodo: 'POST',
    corpo: {
      message: mensagem.trim(),
      link,
      published: publicado ? 'true' : 'false',
      scheduled_publish_time: publicado ? undefined : agendarPara,
    },
  });
}

/**
 * Insights da Página. As métricas padrão são as que substituíram page_impressions e page_fans,
 * descontinuadas para todas as versões da API (page_media_view e page_follows).
 */
export async function obterInsights(env, {
  metricas = ['page_media_view', 'page_follows'], periodo = 'day', desde, ate,
} = {}) {
  return chamarPagina(env, '/insights', {
    params: { metric: metricas, period: periodo, since: desde, until: ate },
  });
}
