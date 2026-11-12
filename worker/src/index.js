import { iniciarTeste } from './licencas';
import { turnstileSitekey } from './turnstile';
import { processarMensagemWhatsApp } from './fluxo';
import { puxarVencidos } from './lembretes';
import { limparVencidos } from './retencao';
import { reservarCotaFoto } from './cotas';
import { ativarSerial, validarLicenca } from './serial';
import { receberWebhookHotmart } from './hotmart';

/**
 * levia-ia-worker - analise de foto do prato para o app Leviã.
 * A imagem nao e persistida nem registrada em logs.
 */
const TAMANHO_MAX_BASE64 = 2_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDIOMAS = { pt: 'português do Brasil', en: 'English', es: 'español', fr: 'français', it: 'italiano' };
const ORIGENS_WEB = ['https://leviapp.org', 'https://www.leviapp.org', 'http://localhost:8081', 'https://typebot.com', 'https://app.typebot.io'];
const APP_BASE_URL_DEFAULT = 'https://leviapp.org';

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

function iguais(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

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

function normalizarTelefoneBR(phone) {
  // Remove all non-digits
  const digits = String(phone).replace(/\D/g, '');
  
  // If already has country code (starts with 55), return as-is
  if (digits.startsWith('55') && digits.length >= 12) {
    return '+' + digits;
  }
  
  // Brazilian numbers: assume +55
  // Format: +55 DDD NUMBER (e.g., +5511999999999)
  if (digits.length === 10 || digits.length === 11) {
    return '+55' + digits;
  }
  
  // If it has a leading 0 (common in Brazil), remove it
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    return '+55' + digits.slice(1);
  }
  
  // Default: return with +55 prefix
  return '+55' + digits;
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
  if (Number(request.headers.get('content-length') ?? 0) > 3_000_000) return json({ erro: 'imagem_invalida' }, 413);
  let corpo;
  try { corpo = await request.json(); } catch { return json({ erro: 'corpo_invalido' }, 400); }
  const { imagem, instalacao, idioma, licenca } = corpo ?? {};
  if (typeof instalacao !== 'string' || !UUID.test(instalacao)) return json({ erro: 'instalacao_invalida' }, 400);
  if (!imagemJpegValida(imagem)) return json({ erro: 'imagem_invalida' }, 400);

  // Só quem ativou um serial usa a IA: a licença é assinada pelo Worker e presa a esta instalação.
  const acesso = await validarLicenca(env, licenca, instalacao);
  if (!acesso.ok) return json(acesso.corpo, acesso.status);

  // Reserva a cota ANTES da chamada externa (falhas do Gemini também contam) e de forma atômica.
  const reserva = await reservarCotaFoto(env, { instalacao, conta: acesso.conta, ip: request.headers.get('cf-connecting-ip') ?? 'sem-ip' });
  if (!reserva.ok) return json(reserva.corpo, reserva.status);
  let resultado;
  try {
    resultado = await perguntarAoGemini(env, imagem, idioma);
  } catch (e) {
    console.error('Erro inesperado em perguntarAoGemini:', e?.message);
    resultado = { falha: 'exception ' + (e?.message || 'unknown') };
  }
  // o detalhe técnico da falha fica no log do Worker, não na resposta
  if (!resultado || resultado.falha) {
    if (resultado?.falha) console.error('falha_ia:', String(resultado.falha).slice(0, 200));
    return json({ erro: 'falha_ia' }, 502);
  }
  return json({ ...resultado, restantes: reserva.restantes });
}

async function verificarAutenticacao(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ erro: 'nao_autorizado' }, 401);
  }
  const token = authHeader.slice(7).trim();
  const expected = env.GATEWAY_TOKEN;
  if (!expected || !iguais(token, expected)) {
    return json({ erro: 'token_invalido' }, 401);
  }
  return null; // OK
}

async function buscarLeadExistente(env, phoneNormalizado) {
  if (!env.LEVIA_DB) return null;
  try {
    const result = await env.LEVIA_DB.prepare(
      'SELECT id FROM leads WHERE phone = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(phoneNormalizado).first();
    return result?.id ?? null;
  } catch (e) {
    console.error('Erro ao buscar lead existente:', e?.message);
    return null;
  }
}

async function processarLead(request, env) {
  // 1. Verificar autenticação
  const authError = await verificarAutenticacao(request, env);
  if (authError) return authError;

  // 2. Rate limiting (10 req/min por IP)
  const kv = env.LEVIA_COTAS;
  const ip = request.headers.get('cf-connecting-ip') ?? 'sem-ip';
  const minuto = new Date().toISOString().slice(0, 16).replace(':', '');
  const chaveRateLimit = `lead:ip:${ip}:${minuto}`;
  const usados = await lerNumero(kv, chaveRateLimit);
  if (usados >= 10) return json({ erro: 'muitas_tentativas' }, 429);

  // 3. Parse e validação do corpo
  let corpo;
  try { corpo = await request.json(); } catch { return json({ erro: 'corpo_invalido' }, 400); }

  const { name, phone, email, pain_point, source } = corpo ?? {};
  
  // Validação obrigatória
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return json({ erro: 'nome_obrigatorio' }, 400);
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    return json({ erro: 'telefone_obrigatorio' }, 400);
  }
  // Autorização explícita: sem o aceite da pessoa nada é gravado (nem a data de consentimento é inventada)
  if (corpo?.consentimento !== true) {
    return json({ erro: 'consentimento_obrigatorio' }, 400);
  }

  // Increment rate limit counter
  await kv.put(chaveRateLimit, String(usados + 1), { expirationTtl: 120 });

  // Normalizar telefone para E.164
  const phoneNormalizado = normalizarTelefoneBR(phone.trim());
  const agora = new Date().toISOString();

  // 4. Deduplicação: verificar se já existe lead com esse telefone
  const leadIdExistente = await buscarLeadExistente(env, phoneNormalizado);
  if (leadIdExistente) {
    const baseUrl = env.APP_BASE_URL || APP_BASE_URL_DEFAULT;
    return json({ pwaLink: `${baseUrl}/onboarding?lead=${leadIdExistente}` });
  }

  // 5. Criar novo lead
  const leadId = crypto.randomUUID();

  // Try to save to D1
  let salvo = false;
  if (env.LEVIA_DB) {
    try {
      await env.LEVIA_DB.prepare(
        `INSERT INTO leads (id, name, phone, email, pain_point, source, consent_at, channel, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        leadId, 
        name.trim(), 
        phoneNormalizado, 
        email?.trim() ?? null, 
        pain_point?.trim() ?? null, 
        source?.trim() ?? 'typebot',
        agora, // consent_at
        'typebot', // channel
        agora, // created_at
        agora  // updated_at
      ).run();
      salvo = true;
    } catch (e) {
      console.error('Erro ao salvar lead no D1:', e?.message);
    }
  }

  // Fallback to KV if D1 failed
  if (!salvo) {
    try {
      const leadData = { 
        id: leadId, 
        name: name.trim(), 
        phone: phoneNormalizado, 
        email: email?.trim() ?? null, 
        pain_point: pain_point?.trim() ?? null, 
        source: source?.trim() ?? 'typebot',
        consent_at: agora,
        channel: 'typebot',
        created_at: agora,
        updated_at: agora
      };
      // mesma chave por telefone que "apagar" (WhatsApp) procura: assim a exclusão alcança este cadastro
      await kv.put(`lead:tel:${phoneNormalizado}`, JSON.stringify(leadData), { expirationTtl: 30 * 24 * 3600 });
    } catch (e) {
      console.error('Erro ao salvar lead no KV:', e?.message);
      return json({ erro: 'falha_armazenamento' }, 503);
    }
  }

  const baseUrl = env.APP_BASE_URL || APP_BASE_URL_DEFAULT;
  return json({ pwaLink: `${baseUrl}/onboarding?lead=${leadId}` });
}


const JANELA_ASSINATURA_MS = 5 * 60 * 1000;

async function hmacHex(segredo, texto) {
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const assinatura = await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(texto));
  return [...new Uint8Array(assinatura)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * O gateway assina `${x-timestamp}.${corpo}` com HMAC-SHA256 (header x-signature).
 * Sem segredo configurado a rota fica fechada; o timestamp (janela de 5 min) impede reenvio de mensagens antigas.
 */
/** Confere a assinatura do gateway (HMAC de `${carimbo}.${corpo}`). Devolve { bruto } ou { resposta } com o erro. */
async function lerCorpoAssinadoDoGateway(request, env) {
  const segredo = env.WHATSAPP_WEBHOOK_SECRET;
  if (!segredo) return { resposta: json({ erro: 'nao_configurado' }, 503) };

  const bruto = await request.text();
  if (bruto.length > 100_000) return { resposta: json({ erro: 'corpo_grande' }, 413) };

  const assinatura = request.headers.get('x-signature') ?? '';
  const carimbo = request.headers.get('x-timestamp') ?? '';
  const instante = Number(carimbo);
  if (!Number.isFinite(instante) || Math.abs(Date.now() - instante) > JANELA_ASSINATURA_MS) {
    return { resposta: json({ erro: 'assinatura_invalida' }, 401) };
  }
  const esperado = await hmacHex(segredo, `${carimbo}.${bruto}`);
  if (!iguais(assinatura, esperado)) return { resposta: json({ erro: 'assinatura_invalida' }, 401) };
  return { bruto };
}

/** O gateway busca aqui os lembretes que já venceram e os envia (cada um sai no máximo uma vez). */
async function entregarLembretesAoGateway(request, env) {
  const lido = await lerCorpoAssinadoDoGateway(request, env);
  if (lido.resposta) return lido.resposta;
  return json({ mensagens: await puxarVencidos(env) });
}

async function processarWhatsAppInbound(request, env) {
  const lido = await lerCorpoAssinadoDoGateway(request, env);
  if (lido.resposta) return lido.resposta;
  const bruto = lido.bruto;

  let corpo;
  try { corpo = JSON.parse(bruto); } catch { return json({ erro: 'corpo_invalido' }, 400); }

  const { messages, phone, messageId, timestamp } = corpo ?? {};
  const mensagens = Array.isArray(messages)
    ? messages
    : corpo?.text || corpo?.body
      ? [{ text: corpo.text || corpo.body, id: messageId, from: phone, timestamp }]
      : [];

  if (mensagens.length === 0) return json({ erro: 'nenhuma_mensagem' }, 400);
  if (mensagens.length > 20) return json({ erro: 'mensagens_demais' }, 413);

  const resultados = [];
  for (const msg of mensagens) {
    const texto = String(msg.text || msg.body || '').trim().slice(0, 1000);
    const msgPhone = msg.from || msg.phone || phone;
    const msgId = msg.id || msg.message_id || messageId;

    if (!msgPhone || !texto || !msgId) {
      resultados.push({ status: 'ignorado', motivo: 'dados_incompletos' });
      continue;
    }

    try {
      const resultado = await processarMensagemWhatsApp(env, msgPhone, texto, String(msgId));
      if (resultado.tipo === 'duplicado') {
        resultados.push({ status: 'duplicado' });
        continue;
      }
      resultados.push({ status: resultado.tipo, resposta: resultado.resposta, respostas: resultado.respostas, pwaLink: resultado.pwaLink, leadId: resultado.leadId });
    } catch (e) {
      console.error('Erro ao processar mensagem:', e?.message);
      resultados.push({ status: 'erro', erro: 'interno' });
    }
  }

  return json({ processados: resultados.length, resultados });
}

export default {
  // cron diário (wrangler.toml [triggers]): apaga o que passou do prazo de retenção
  async scheduled(_evento, env, ctx) {
    ctx.waitUntil(limparVencidos(env));
  },
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const origem = request.headers.get('Origin');
    if ((pathname === '/v1/analisar-prato' || pathname === '/v1/ativar' || pathname === '/v1/turnstile/sitekey' || pathname === '/api/lead') && request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cabecalhosCors(origem) });
    }
    if (pathname === '/v1/turnstile/sitekey' && request.method === 'GET') {
      return comCors(turnstileSitekey(env), origem);
    }
    if (pathname === '/v1/teste/iniciar' && request.method === 'POST') {
      try { return await iniciarTeste(request, env); }
      catch (e) { console.error('erro teste', e?.message); return json({ erro: 'interno' }, 500); }
    }
    if (pathname === '/v1/ativar' && request.method === 'POST') {
      try { return comCors(await ativarSerial(request, env), origem); }
      catch (e) { console.error('erro ativar', e?.message); return comCors(json({ erro: 'interno' }, 500), origem); }
    }
    if (pathname === '/v1/hotmart/webhook' && request.method === 'POST') {
      try { return await receberWebhookHotmart(request, env); }
      catch (e) { console.error('erro hotmart', e?.message); return json({ erro: 'interno' }, 500); }
    }
    if (pathname === '/v1/analisar-prato' && request.method === 'POST') {
      try { return comCors(await analisarPrato(request, env), origem); }
      catch (e) { console.error('erro', e?.message); return comCors(json({ erro: 'interno' }, 500), origem); }
    }
    if (pathname === '/api/lead' && request.method === 'POST') {
      try { return comCors(await processarLead(request, env), origem); }
      catch (e) { console.error('erro lead', e?.message); return comCors(json({ erro: 'interno' }, 500), origem); }
    }
    if (pathname === '/api/wa/outbox/pull' && request.method === 'POST') {
      try { return await entregarLembretesAoGateway(request, env); }
      catch (e) { console.error('erro wa outbox', e?.message); return json({ erro: 'interno' }, 500); }
    }
    if (pathname === '/api/wa/inbound' && request.method === 'POST') {
      try { return comCors(await processarWhatsAppInbound(request, env), origem); }
      catch (e) { console.error('erro wa inbound', e?.message); return comCors(json({ erro: 'interno' }, 500), origem); }
    }
    if (pathname === '/health') return json({ ok: true });
    // commit publicado (GIT_SHA entra no deploy, ver .github/workflows/deploy-cloudflare-worker.yml); so um hash publico, nada sensivel
    if (pathname === '/versao' && request.method === 'GET') return json({ commit: String(env.GIT_SHA ?? 'desconhecido').slice(0, 40) });
    return json({ erro: 'nao_encontrado' }, 404);
  },
};
