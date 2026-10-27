import { iniciarTeste } from './licencas';
import { turnstileSitekey, validarTurnstile } from './turnstile';

/**
 * levia-ia-worker — análise de foto do prato para o app Leviã.
 * A imagem não é persistida nem registrada em logs.
 */
const TAMANHO_MAX_BASE64 = 2_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SETE_DIAS_MS = 7 * 24 * 3600 * 1000;
const IDIOMAS = { pt: 'português do Brasil', en: 'English', es: 'español', fr: 'français', it: 'italiano' };
const ORIGENS_WEB = ['https://levia-app.netlify.app', 'http://localhost:8081', 'https://typebot.com', 'https://app.typebot.io'];

function cabecalhosCors(origem) {
  if (!origem || !ORIGENS_WEB.includes(origem)) return {};
  return {
    'Access-Control-Allow-Origin': origem,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
  const chaveInst = `inst:${instalacao}`;
  const historico = ((await kv.get(chaveInst, 'json')) ?? []).filter((t) => agora - t < SETE_DIAS_MS);
  const limite = Number(env.FOTOS_GRATIS_7D || 2);
  if (historico.length >= limite) {
    const liberaEm = new Date(Math.min(...historico) + SETE_DIAS_MS).toISOString();
    return json({ erro: 'cota_esgotada', limite, liberaEm }, 402);
  }

  // Reserva cota antes da chamada externa para que falhas do Gemini também contem.
  historico.push(agora);
  await Promise.all([
    kv.put(chaveInst, JSON.stringify(historico), { expirationTtl: 8 * 24 * 3600 }),
    kv.put(chaveDia, String(usadosDia + 1), { expirationTtl: 3 * 24 * 3600 }),
    kv.put(chaveIp, String(usadosIp + 1), { expirationTtl: 2 * 3600 }),
  ]);
  const resultado = await perguntarAoGemini(env, imagem, idioma);
  if (!resultado || resultado.falha) return json({ erro: 'falha_ia', motivo: resultado?.falha }, 502);
  return json({ ...resultado, restantes: Math.max(0, limite - historico.length) });
}

async function processarLead(request, env) {
  const kv = env.LEVIA_COTAS;
  const ip = request.headers.get('cf-connecting-ip') ?? 'sem-ip';
  const minuto = new Date().toISOString().slice(0, 16).replace(':', '');
  const chaveRateLimit = `lead:ip:${ip}:${minuto}`;
  const usados = await lerNumero(kv, chaveRateLimit);
  if (usados >= 10) return json({ erro: 'muitas_tentativas' }, 429);

  let corpo;
  try { corpo = await request.json(); } catch { return json({ erro: 'corpo_invalido' }, 400); }

  const { name, phone, email, pain_point, source } = corpo ?? {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return json({ erro: 'nome_obrigatorio' }, 400);
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    return json({ erro: 'telefone_obrigatorio' }, 400);
  }

  // Increment rate limit counter
  await kv.put(chaveRateLimit, String(usados + 1), { expirationTtl: 120 });

  const leadId = crypto.randomUUID();
  const agora = new Date().toISOString();

  // Try to save to D1
  let salvo = false;
  if (env.LEVIA_DB) {
    try {
      await env.LEVIA_DB.prepare(
        'INSERT INTO leads (id, name, phone, email, pain_point, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(leadId, name.trim(), phone.trim(), email?.trim() ?? null, pain_point?.trim() ?? null, source?.trim() ?? null, agora).run();
      salvo = true;
    } catch (e) {
      console.error('Erro ao salvar lead no D1:', e?.message);
    }
  }

  // Fallback to KV if D1 failed
  if (!salvo) {
    try {
      const leadData = { id: leadId, name: name.trim(), phone: phone.trim(), email: email?.trim() ?? null, pain_point: pain_point?.trim() ?? null, source: source?.trim() ?? null, created_at: agora };
      await kv.put(`lead:${leadId}`, JSON.stringify(leadData), { expirationTtl: 30 * 24 * 3600 });
    } catch (e) {
      console.error('Erro ao salvar lead no KV:', e?.message);
    }
  }

  return json({ pwaLink: `https://levia.app/onboarding?lead=${leadId}` });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const origem = request.headers.get('Origin');
    if ((pathname === '/v1/analisar-prato' || pathname === '/v1/turnstile/sitekey' || pathname === '/api/lead') && request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cabecalhosCors(origem) });
    }
    if (pathname === '/v1/turnstile/sitekey' && request.method === 'GET') {
      return comCors(turnstileSitekey(env), origem);
    }
    if (pathname === '/v1/teste/iniciar' && request.method === 'POST') {
      try { return iniciarTeste(request, env); }
      catch (e) { console.error('erro teste', e?.message); return json({ erro: 'interno' }, 500); }
    }
    if (pathname === '/v1/analisar-prato' && request.method === 'POST') {
      try { return comCors(await analisarPrato(request, env), origem); }
      catch (e) { console.error('erro', e?.message); return comCors(json({ erro: 'interno' }, 500), origem); }
    }
    if (pathname === '/api/lead' && request.method === 'POST') {
      try { return comCors(await processarLead(request, env), origem); }
      catch (e) { console.error('erro lead', e?.message); return comCors(json({ erro: 'interno' }, 500), origem); }
    }
    if (pathname === '/health') return json({ ok: true });
    return json({ erro: 'nao_encontrado' }, 404);
  },
};