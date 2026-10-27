import { iniciarTeste, ativarTeste, verifySessionToken, validarLicenca } from './licencas';
import { turnstileSitekey, validarTurnstile } from './turnstile';
import { handleHotmartWebhook } from './webhook';
import { enviarWhatsApp } from './whatsapp';
import { handleReminders } from './reminders';


/**
 * levia-ia-worker — análise de foto do prato para o app Leviã.
 * A imagem não é persistida nem registrada em logs.
 */
const TAMANHO_MAX_BASE64 = 2_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SETE_DIAS_MS = 7 * 24 * 3600 * 1000;
const IDIOMAS = { pt: 'português do Brasil', en: 'English', es: 'español', fr: 'français', it: 'italiano' };
const ORIGENS_WEB = ['https://levia-app.netlify.app', 'http://localhost:8081'];

function cabecalhosCors(origem) {
  if (!origem || !ORIGENS_WEB.includes(origem)) return {};
  return {
    'Access-Control-Allow-Origin': origem,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(corpo, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function comCors(resposta, origem) {
  const extra = cabecalhosCors(origem);
  if (!Object.keys(extra).length) return resposta;
  const h = new Headers(resposta.headers);
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return new Response(resposta.body, { status: resposta.status, headers: h });
}

const hojeUTC = () => new Date().toISOString().slice(0, 10);
async function lerNumero(kv, chave) { return Number((await kv.get(chave)) ?? 0); }

function imagemJpegValida(valor) {
  if (typeof valor !== 'string' || valor.length < 1000 || valor.length > TAMANHO_MAX_BASE64) return false;
  if (valor.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(valor)) return false;
  try {
    const inicio = atob(valor.slice(0, 8));
    return inicio.charCodeAt(0) === 0xff && inicio.charCodeAt(1) === 0xd8 && inicio.charCodeAt(2) === 0xff;
  } catch {
    return false;
  }
}

function prompt(idioma) {
  const lingua = IDIOMAS[idioma] ?? IDIOMAS.pt;
  return `Você é um nutricionista analisando a foto de uma refeição.
Liste cada alimento visível no prato e estime o peso em gramas da porção como servida (cozida/pronta, parte comestível).
Regras:
- "nome": nome simples e genérico do alimento em ${lingua}, com o preparo quando der para ver.
- "nomeIngles": o mesmo nome em inglês.
- Separe os componentes do prato. Molhos e óleos visíveis contam como item próprio.
- "unidades": quantas unidades daquele alimento aparecem; para alimentos sem unidade, use 1.
- "gramas": peso TOTAL de todas as unidades daquele alimento no prato.
- "por100g": estimativa de kcal, proteína, carboidrato, gordura e fibra por 100 g.
- "confianca": de 0 a 1, confiança na identificação e no peso.
- Se não for comida, devolva "ehComida": false e lista vazia.
- No máximo 12 itens. Não invente alimentos que não aparecem.`;
}

const ESQUEMA = {
  type: 'OBJECT',
  properties: {
    ehComida: { type: 'BOOLEAN' },
    itens: { type: 'ARRAY', items: {
      type: 'OBJECT',
      properties: {
        nome: { type: 'STRING' }, nomeIngles: { type: 'STRING' }, unidades: { type: 'NUMBER' },
        gramas: { type: 'NUMBER' }, confianca: { type: 'NUMBER' },
        por100g: { type: 'OBJECT', properties: {
          kcal: { type: 'NUMBER' }, proteina: { type: 'NUMBER' }, carboidrato: { type: 'NUMBER' }, gordura: { type: 'NUMBER' }, fibra: { type: 'NUMBER' },
        }, required: ['kcal', 'proteina', 'carboidrato', 'gordura', 'fibra'] },
      }, required: ['nome', 'nomeIngles', 'unidades', 'gramas', 'confianca', 'por100g'],
    } },
  }, required: ['ehComida', 'itens'],
};

function limparPor100g(v) {
  const n = (x, max) => Math.max(0, Math.min(max, Math.round((Number(x) || 0) * 10) / 10));
  return { kcal: Math.round(n(v?.kcal, 900)), proteina: n(v?.proteina, 100), carboidrato: n(v?.carboidrato, 100), gordura: n(v?.gordura, 100), fibra: n(v?.fibra, 100) };
}

async function perguntarAoGemini(env, imagemBase64, idioma) {
  const modelo = env.GEMINI_MODEL || 'gemini-3.8-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'image/jpeg', data: imagemBase64 } }, { text: prompt(idioma) }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: ESQUEMA },
    }),
  });
  if (!r.ok) {
    let motivo = '';
    try { motivo = String((await r.json())?.error?.status ?? ''); } catch {}
    console.error('gemini', r.status, motivo);
    return { falha: `${r.status} ${motivo}`.trim() };
  }
  const dados = await r.json();
  const texto = dados?.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === 'string')?.text;
  const uso = dados?.usageMetadata ?? {};
  console.log('uso', modelo, uso.promptTokenCount, uso.candidatesTokenCount, uso.thoughtsTokenCount ?? 0);
  try {
    const res = JSON.parse(texto);
    const itens = (Array.isArray(res.itens) ? res.itens : []).slice(0, 12).map((i) => ({
      nome: String(i.nome ?? '').slice(0, 80), nomeIngles: String(i.nomeIngles ?? '').slice(0, 80),
      unidades: Math.max(1, Math.min(50, Math.round(Number(i.unidades) || 1))),
      gramas: Math.max(1, Math.min(2000, Math.round(Number(i.gramas) || 0))),
      confianca: Math.max(0, Math.min(1, Number(i.confianca) || 0)), por100g: limparPor100g(i.por100g),
    })).filter((i) => i.nome);
    return { ehComida: res.ehComida !== false && itens.length > 0, itens };
  } catch {
    const fim = dados?.candidates?.[0]?.finishReason ?? dados?.promptFeedback?.blockReason ?? 'sem_texto';
    console.error('gemini: resposta sem JSON válido', fim);
    return { falha: `json ${fim} ${typeof texto === 'string' ? texto.length : 0}` };
  }
}

async function validarSessaoETrial(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return { erro: 'sessao_obrigatoria' };
  
  const token = auth.slice(7);
  const accountId = await verifySessionToken(token, env);
  if (!accountId) return { erro: 'sessao_invalida' };
  
  const trial = await env.LEVIA_DB.prepare(
    'SELECT * FROM trials WHERE account_id = ? AND status = ? LIMIT 1'
  ).bind(accountId, 'active').first();
  
  if (!trial) return { erro: 'trial_inexistente' };
  
  const agora = new Date();
  const expiraEm = new Date(trial.expires_at);
  if (agora > expiraEm) {
    await env.LEVIA_DB.prepare(
      'UPDATE trials SET status = ?, updated_at = ? WHERE account_id = ?'
    ).bind('expired', agora.toISOString(), accountId).run();
    return { erro: 'trial_expirado' };
  }
  
  if (trial.photo_used >= trial.photo_limit) {
    const liberaEm = new Date(agora.getTime() + SETE_DIAS_MS).toISOString();
    return { erro: 'cota_esgotada', limite: trial.photo_limit, liberaEm };
  }
  
  return { accountId, trial };
}

async function analisarPrato(request, env) {
  if (!env.GEMINI_API_KEY) return json({ erro: 'nao_configurado' }, 503);
  if (!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY) return json({ erro: 'protecao_nao_configurada' }, 503);
  
  let corpo;
  try { corpo = await request.json(); } catch { return json({ erro: 'corpo_invalido' }, 400); }
  
  const { imagem, instalacao, idioma, turnstileToken } = corpo ?? {};
  if (typeof instalacao !== 'string' || !UUID.test(instalacao)) return json({ erro: 'instalacao_invalida' }, 400);
  if (!imagemJpegValida(imagem)) return json({ erro: 'imagem_invalida' }, 400);

  const verificacao = await validarTurnstile(request, env, turnstileToken);
  if (!verificacao.ok) return verificacao.response;

  const sessao = await validarSessaoETrial(request, env);
  if (sessao.erro) return json(sessao, sessao.erro === 'trial_expirado' ? 410 : sessao.erro === 'cota_esgotada' ? 402 : sessao.erro === 'sessao_obrigatoria' || sessao.erro === 'sessao_invalida' ? 401 : 403);

  const kv = env.LEVIA_COTAS;
  const agora = Date.now();
  const dia = hojeUTC();
  const ip = request.headers.get('cf-connecting-ip') ?? 'sem-ip';
  const hora = new Date().toISOString().slice(0, 13);
  const chaveDia = `dia:${dia}`;
  const usadosDia = await lerNumero(kv, chaveDia);
  if (usadosDia >= Number(env.MAX_FOTOS_DIA || 300)) return json({ erro: 'limite_servico' }, 429);
  const chaveIp = `ip:${ip}:${hora}`;
  const usadosIp = await lerNumero(kv, chaveIp);
  if (usadosIp >= Number(env.MAX_FOTOS_IP_HORA || 20)) return json({ erro: 'muitas_tentativas' }, 429);

  // Reserva cota antes da chamada externa para que falhas do Gemini também contem.
  await Promise.all([
    kv.put(chaveDia, String(usadosDia + 1), { expirationTtl: 3 * 24 * 3600 }),
    kv.put(chaveIp, String(usadosIp + 1), { expirationTtl: 2 * 3600 }),
    env.LEVIA_DB.prepare(
      'UPDATE trials SET photo_used = photo_used + 1, updated_at = ? WHERE account_id = ?'
    ).bind(new Date().toISOString(), sessao.accountId).run(),
  ]);
  
  const resultado = await perguntarAoGemini(env, imagem, idioma);
  if (!resultado || resultado.falha) return json({ erro: 'falha_ia', motivo: resultado?.falha }, 502);
  
  // Buscar trial atualizado para retornar restantes
  const trialAtualizado = await env.LEVIA_DB.prepare(
    'SELECT photo_limit, photo_used FROM trials WHERE account_id = ?'
  ).bind(sessao.accountId).first();
  
  const restantes = trialAtualizado ? Math.max(0, trialAtualizado.photo_limit - trialAtualizado.photo_used) : 0;
  
  return json({ ...resultado, restantes });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const origem = request.headers.get('Origin');
    
    // CORS preflight
    if ((pathname === '/v1/analisar-prato' || pathname === '/v1/turnstile/sitekey' || pathname === '/v1/teste/ativar' || pathname === '/v1/licenca/validar') && request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cabecalhosCors(origem) });
    }
    
    if (pathname === '/v1/turnstile/sitekey' && request.method === 'GET') {
      return comCors(turnstileSitekey(env), origem);
    }
    
    if (pathname === '/v1/teste/iniciar' && request.method === 'POST') {
      try { return iniciarTeste(request, env); }
      catch (e) { console.error('erro teste', e?.message); return json({ erro: 'interno' }, 500); }
    }
    
    if (pathname === '/v1/teste/ativar' && request.method === 'POST') {
      try { return ativarTeste(request, env); }
      catch (e) { console.error('erro ativar', e?.message); return json({ erro: 'interno' }, 500); }
    }
    
    if (pathname === '/v1/analisar-prato' && request.method === 'POST') {
      try { return comCors(await analisarPrato(request, env), origem); }
      catch (e) { console.error('erro', e?.message); return comCors(json({ erro: 'interno' }, 500), origem); }
    }
    
    if (pathname === '/v1/licenca/validar' && request.method === 'POST') {
      try { return comCors(await validarLicenca(request, env), origem); }
      catch (e) { console.error('erro validar licenca', e?.message); return comCors(json({ erro: 'interno' }, 500), origem); }
    }

    if (pathname === '/v1/webhook/hotmart' && request.method === 'POST') {
      try { return handleHotmartWebhook(request, env); }
      catch (e) { console.error('erro webhook', e?.message); return json({ erro: 'interno' }, 500); }
    }
    
    if (pathname === '/v1/whatsapp' && request.method === 'POST') {
      try { return enviarWhatsApp(request, env); }
      catch (e) { console.error('erro whatsapp', e?.message); return json({ erro: 'interno' }, 500); }
    }

    if (pathname === '/health') return json({ ok: true });
    return json({ erro: 'nao_encontrado' }, 404);
  },

  async scheduled(event, env, ctx) {
    if (event.cron === '0 9 * * *') {
      ctx.waitUntil(handleReminders(env));
    }
  },
};







