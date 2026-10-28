import { iniciarTeste } from './licencas';

/**
 * levia-ia-worker — análise de foto do prato + captura de leads WhatsApp para o app Leviã.
 *
 * Rotas:
 * - POST /v1/analisar-prato      → análise de foto (existente)
 * - POST /v1/teste/iniciar       → iniciar teste (existente)
 * - POST /api/lead               → capturar lead do WhatsApp/Typebot (NOVO - PR 1)
 * - GET  /health                 → health check
 */

const TAMANHO_MAX_BASE64 = 2_000_000; // ~1,5 MB de imagem
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SETE_DIAS_MS = 7 * 24 * 3600 * 1000;

const IDIOMAS = { pt: 'português do Brasil', en: 'English', es: 'español', fr: 'français', it: 'italiano' };

/**
 * Versão web (PWA): o navegador só deixa a página chamar o worker se ele
 * responder com estes cabeçalhos (CORS). Só os endereços do Leviã são aceitos.
 * O app de celular não usa CORS e continua funcionando igual.
 */
const ORIGENS_WEB = ['https://levia-app.netlify.app', 'http://localhost:8081'];

/** Origens permitidas para o endpoint /api/lead (Typebot, WhatsApp gateway, etc.) */
const ORIGENS_LEAD = [
  'https://levia-app.netlify.app',
  'http://localhost:8081',
  'https://app.typebot.io',
  'https://typebot.com',
];

function cabecalhosCors(origem) {
  if (!origem || !ORIGENS_WEB.includes(origem)) return {};
  return {
    'Access-Control-Allow-Origin': origem,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-levia-app',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function cabecalhosCorsLead(origem) {
  if (!origem || !ORIGENS_LEAD.includes(origem)) return {};
  return {
    'Access-Control-Allow-Origin': origem,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

function comCorsLead(resposta, origem) {
  const extra = cabecalhosCorsLead(origem);
  if (!Object.keys(extra).length) return resposta;
  const h = new Headers(resposta.headers);
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return new Response(resposta.body, { status: resposta.status, headers: h });
}

/** Comparação em tempo constante (evita descobrir o token pelo tempo de resposta) */
function iguais(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

const hojeUTC = () => new Date().toISOString().slice(0, 10);

async function lerNumero(kv, chave) {
  return Number((await kv.get(chave)) ?? 0);
}

function prompt(idioma) {
  const lingua = IDIOMAS[idioma] ?? IDIOMAS.pt;
  return `Você é um nutricionista analisando a foto de uma refeição.
Liste cada alimento visível no prato e estime o peso em gramas da porção como servida (cozida/pronta, parte comestível).
Regras:
- "nome": nome simples e genérico do alimento em ${lingua}, com o preparo quando der para ver (ex.: "Arroz branco cozido", "Feijão carioca cozido", "Peito de frango grelhado", "Alface crua", "Batata frita").
- "nomeIngles": o mesmo nome em inglês (ex.: "White rice, cooked").
- Separe os componentes do prato (arroz e feijão são dois itens; macarrão e molho são dois itens). Molhos e óleos visíveis contam como item próprio.
- "unidades": quantas unidades daquele alimento aparecem (ex.: 4 coxinhas). Para alimentos sem unidade (arroz, molho), use 1.
- "gramas": peso TOTAL de todas as unidades juntas daquele alimento no prato (4 coxinhas de 30 g = 120). Use o tamanho do prato, talheres e mãos como referência. Na dúvida, prefira porções típicas brasileiras.
- "por100g": sua estimativa de kcal, proteína, carboidrato, gordura e fibra em 100 g desse alimento como foi preparado (usada só quando o alimento não estiver na tabela do app).
- "confianca": de 0 a 1, quanto você confia na identificação E no peso.
- Se a foto não for de comida, devolva "ehComida": false e a lista vazia.
- No máximo 12 itens. Não invente alimentos que não aparecem.`;
}

const ESQUEMA = {
  type: 'OBJECT',
  properties: {
    ehComida: { type: 'BOOLEAN' },
    itens: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          nome: { type: 'STRING' },
          nomeIngles: { type: 'STRING' },
          unidades: { type: 'NUMBER' },
          gramas: { type: 'NUMBER' },
          confianca: { type: 'NUMBER' },
          por100g: {
            type: 'OBJECT',
            properties: {
              kcal: { type: 'NUMBER' },
              proteina: { type: 'NUMBER' },
              carboidrato: { type: 'NUMBER' },
              gordura: { type: 'NUMBER' },
              fibra: { type: 'NUMBER' },
            },
            required: ['kcal', 'proteina', 'carboidrato', 'gordura', 'fibra'],
          },
        },
        required: ['nome', 'nomeIngles', 'unidades', 'gramas', 'confianca', 'por100g'],
      },
    },
  },
  required: ['ehComida', 'itens'],
};

/** Estimativa por 100 g da IA, com limites físicos (100 g não têm mais que 100 g de nutrientes) */
function limparPor100g(v) {
  const n = (x, max) => Math.max(0, Math.min(max, Math.round((Number(x) || 0) * 10) / 10));
  return {
    kcal: Math.round(n(v?.kcal, 900)),
    proteina: n(v?.proteina, 100),
    carboidrato: n(v?.carboidrato, 100),
    gordura: n(v?.gordura, 100),
    fibra: n(v?.fibra, 100),
  };
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
    try {
      motivo = String((await r.json())?.error?.status ?? '');
    } catch {}
    console.error('gemini', r.status, motivo);
    return { falha: `${r.status} ${motivo}`.trim() };
  }
  const dados = await r.json();
  const texto = dados?.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === 'string')?.text;
  const uso = dados?.usageMetadata ?? {};
  console.log('uso', modelo, uso.promptTokenCount, uso.candidatesTokenCount, uso.thoughtsTokenCount ?? 0);
  try {
    const res = JSON.parse(texto);
    const itens = (Array.isArray(res.itens) ? res.itens : [])
      .slice(0, 12)
      .map((i) => ({
        nome: String(i.nome ?? '').slice(0, 80),
        nomeIngles: String(i.nomeIngles ?? '').slice(0, 80),
        unidades: Math.max(1, Math.min(50, Math.round(Number(i.unidades) || 1))),
        gramas: Math.max(1, Math.min(2000, Math.round(Number(i.gramas) || 0))),
        confianca: Math.max(0, Math.min(1, Number(i.confianca) || 0)),
        por100g: limparPor100g(i.por100g),
      }))
      .filter((i) => i.nome);
    return { ehComida: res.ehComida !== false && itens.length > 0, itens };
  } catch {
    const fim = dados?.candidates?.[0]?.finishReason ?? dados?.promptFeedback?.blockReason ?? 'sem_texto';
    console.error('gemini: resposta sem JSON válido', fim);
    return { falha: `json ${fim} ${typeof texto === 'string' ? texto.length : 0}` };
  }
}

async function analisarPrato(request, env) {
  if (!env.APP_TOKEN || !env.GEMINI_API_KEY) return json({ erro: 'nao_configurado' }, 503);
  if (!iguais(request.headers.get('x-levia-app') ?? '', env.APP_TOKEN)) return json({ erro: 'nao_autorizado' }, 401);

  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return json({ erro: 'corpo_invalido' }, 400);
  }
  const { imagem, instalacao, idioma } = corpo ?? {};
  if (typeof instalacao !== 'string' || !UUID.test(instalacao)) return json({ erro: 'instalacao_invalida' }, 400);
  if (typeof imagem !== 'string' || imagem.length < 1000 || imagem.length > TAMANHO_MAX_BASE64) return json({ erro: 'imagem_invalida' }, 400);

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

  const resultado = await perguntarAoGemini(env, imagem, idioma);
  if (!resultado || resultado.falha) return json({ erro: 'falha_ia', motivo: resultado?.falha }, 502);

  historico.push(agora);
  await Promise.all([
    kv.put(chaveInst, JSON.stringify(historico), { expirationTtl: 8 * 24 * 3600 }),
    kv.put(chaveDia, String(usadosDia + 1), { expirationTtl: 3 * 24 * 3600 }),
    kv.put(chaveIp, String(usadosIp + 1), { expirationTtl: 2 * 3600 }),
  ]);

  return json({ ...resultado, restantes: Math.max(0, limite - historico.length) });
}

/**
 * ===== NOVO: Endpoint /api/lead (PR 1 - Worker hardening) =====
 * Captura leads do WhatsApp/Typebot com:
 * - Auth via GATEWAY_TOKEN (Bearer)
 * - Validação server-side (tamanhos, email, phone E.164, source whitelist)
 * - Dedupe por telefone (reutiliza lead existente)
 * - Retorna 503 se D1+KV falharem
 * - Link usando APP_BASE_URL (default leviapp.org)
 * - Rate limit por IP (10 req/min) via KV
 */

const MAX_NAME = 80;
const MAX_PAIN_POINT = 500;
const MAX_EMAIL = 254;
const PHONE_E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCES_PERMITIDOS = ['whatsapp', 'web', 'typebot', 'api'];

function normalizarTelefone(valor) {
  if (typeof valor !== 'string') return '';
  let limpo = valor.replace(/[\s().-]/g, '');
  if (!limpo.startsWith('+')) {
    // Assume Brasil se não tem código do país
    if (limpo.length === 10 || limpo.length === 11) {
      limpo = '+55' + limpo;
    } else if (limpo.length === 12 && limpo.startsWith('55')) {
      limpo = '+' + limpo;
    }
  }
  return limpo;
}

function validarLead(body) {
  const erros = [];
  
  // name (obrigatório)
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) erros.push('name: obrigatório');
  else if (name.length > MAX_NAME) erros.push(`name: máx ${MAX_NAME} caracteres`);
  
  // phone (obrigatório)
  const phoneRaw = typeof body?.phone === 'string' ? body.phone : '';
  const phone = normalizarTelefone(phoneRaw);
  if (!phone) erros.push('phone: obrigatório');
  else if (!PHONE_E164.test(phone)) erros.push('phone: formato inválido (use E.164, ex: +5511999999999)');
  
  // email (opcional)
  let email = '';
  if (body?.email) {
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email && (email.length > MAX_EMAIL || !EMAIL_RE.test(email))) {
      erros.push('email: formato inválido');
    }
  }
  
  // pain_point (opcional)
  let pain_point = '';
  if (body?.pain_point) {
    pain_point = typeof body.pain_point === 'string' ? body.pain_point.trim() : '';
    if (pain_point.length > MAX_PAIN_POINT) {
      erros.push(`pain_point: máx ${MAX_PAIN_POINT} caracteres`);
    }
  }
  
  // source (opcional, default whatsapp)
  const source = SOURCES_PERMITIDOS.includes(body?.source) ? body.source : 'whatsapp';
  
  // consent (opcional, timestamp ISO)
  let consent_at = null;
  if (body?.consent_at) {
    const d = new Date(body.consent_at);
    if (!isNaN(d.getTime())) consent_at = d.toISOString();
  }
  
  return { name, phone, email, pain_point, source, consent_at, erros };
}

async function rateLimitCheck(kv, ip) {
  const chave = `ratelimit:lead:${ip}:${Math.floor(Date.now() / 60000)}`; // janela de 1 min
  const atual = Number((await kv.get(chave)) ?? 0);
  if (atual >= 10) return false; // 10 req/min
  await kv.put(chave, String(atual + 1), { expirationTtl: 120 });
  return true;
}

async function buscarLeadPorTelefone(db, phone) {
  const row = await db.prepare('SELECT id FROM leads WHERE phone = ? LIMIT 1').bind(phone).first();
  return row?.id || null;
}

async function criarOuAtualizarLead(db, leadData) {
  const { name, phone, email, pain_point, source, consent_at } = leadData;
  const agora = new Date().toISOString();
  const leadId = crypto.randomUUID();
  
  // Tenta inserir novo
  try {
    await db.prepare(
      `INSERT INTO leads (id, name, phone, email, pain_point, source, consent_at, channel, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(leadId, name, phone, email || null, pain_point || null, source, consent_at, source, agora, agora).run();
    return { leadId, isNew: true };
  } catch (e) {
    // Se falhou por duplicate phone, busca o existente e atualiza
    const existingId = await buscarLeadPorTelefone(db, phone);
    if (existingId) {
      await db.prepare(
        `UPDATE leads SET name = ?, email = ?, pain_point = ?, source = ?, consent_at = ?, channel = ?, updated_at = ?
         WHERE id = ?`
      ).bind(name, email || null, pain_point || null, source, consent_at, source, agora, existingId).run();
      return { leadId: existingId, isNew: false };
    }
    throw e; // Re-throw se não foi duplicate phone
  }
}

async function salvarLeadKV(kv, leadData, leadId) {
  const chave = `lead:${leadId}`;
  await kv.put(chave, JSON.stringify({ ...leadData, id: leadId }), { expirationTtl: 30 * 24 * 3600 });
}

async function processarLead(request, env) {
  const origem = request.headers.get('Origin');
  
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cabecalhosCorsLead(origem) });
  }
  
  if (request.method !== 'POST') {
    return comCorsLead(json({ erro: 'metodo_nao_permitido' }, 405), origem);
  }
  
  // Auth: GATEWAY_TOKEN obrigatório
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!env.GATEWAY_TOKEN || !iguais(token, env.GATEWAY_TOKEN)) {
    return comCorsLead(json({ erro: 'nao_autorizado' }, 401), origem);
  }
  
  // Rate limit por IP
  const ip = request.headers.get('cf-connecting-ip') ?? 'sem-ip';
  const okRate = await rateLimitCheck(env.LEVIA_COTAS, ip);
  if (!okRate) {
    return comCorsLead(json({ erro: 'muitas_tentativas' }, 429), origem);
  }
  
  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return comCorsLead(json({ erro: 'corpo_invalido' }, 400), origem);
  }
  
  // Validação
  const { name, phone, email, pain_point, source, consent_at, erros } = validarLead(body);
  if (erros.length > 0) {
    return comCorsLead(json({ erro: 'validacao', detalhes: erros }, 400), origem);
  }
  
  // Verifica se já existe lead para este telefone (dedupe)
  let leadId = await buscarLeadPorTelefone(env.LEVIA_DB, phone);
  let isNew = false;
  
  if (!leadId) {
    // Cria novo lead
    try {
      const result = await criarOuAtualizarLead(env.LEVIA_DB, { name, phone, email, pain_point, source, consent_at });
      leadId = result.leadId;
      isNew = result.isNew;
    } catch (e) {
      console.error('Erro ao criar lead no D1:', e?.message);
      // Fallback: tenta KV
      leadId = crypto.randomUUID();
      await salvarLeadKV(env.LEVIA_COTAS, { name, phone, email, pain_point, source, consent_at }, leadId);
      isNew = true;
    }
  } else {
    // Atualiza lead existente
    try {
      await criarOuAtualizarLead(env.LEVIA_DB, { name, phone, email, pain_point, source, consent_at });
      isNew = false;
    } catch (e) {
      console.error('Erro ao atualizar lead no D1:', e?.message);
      // Fallback KV
      await salvarLeadKV(env.LEVIA_COTAS, { name, phone, email, pain_point, source, consent_at }, leadId);
      isNew = false;
    }
  }
  
  // Monta link de onboarding usando APP_BASE_URL
  const baseUrl = env.APP_BASE_URL || 'https://leviapp.org';
  const pwaLink = `${baseUrl}/onboarding?lead=${leadId}`;
  
  return comCorsLead(json({ pwaLink, lead_id: leadId, is_new: isNew }), origem);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const origem = request.headers.get('Origin');
    
    // Rotas existentes
    if (pathname === '/v1/analisar-prato' && request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cabecalhosCors(origem) });
    }
    if (pathname === '/v1/teste/iniciar' && request.method === 'POST') {
      try {
        return iniciarTeste(request, env);
      } catch (e) {
        console.error('erro teste', e?.message);
        return json({ erro: 'interno' }, 500);
      }
    }
    if (pathname === '/v1/analisar-prato' && request.method === 'POST') {
      try {
        return comCors(await analisarPrato(request, env), origem);
      } catch (e) {
        console.error('erro', e?.message);
        return comCors(json({ erro: 'interno' }, 500), origem);
      }
    }
    
    // NOVA ROTA: /api/lead
    if (pathname === '/api/lead') {
      try {
        return await processarLead(request, env);
      } catch (e) {
        console.error('erro lead', e?.message);
        // Se D1 e KV falharem, retorna 503
        return comCorsLead(json({ erro: 'servico_indisponivel' }, 503), origem);
      }
    }
    
    if (pathname === '/health') return json({ ok: true });
    return json({ erro: 'nao_encontrado' }, 404);
  },
};