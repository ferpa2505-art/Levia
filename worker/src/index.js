/**
 * levia-ia-worker — análise de foto do prato para o app Leviã.
 *
 * O app manda a foto (JPEG reduzido, em base64) e o id da instalação.
 * O worker confere as cotas, pergunta ao Gemini QUAIS alimentos há no prato
 * e QUANTOS GRAMAS de cada, e devolve só essa lista. Os nutrientes são
 * calculados no próprio app, com o banco de alimentos (TACO/CIQUAL/USDA).
 *
 * A foto não é guardada nem registrada em log.
 */

const TAMANHO_MAX_BASE64 = 2_000_000; // ~1,5 MB de imagem
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SETE_DIAS_MS = 7 * 24 * 3600 * 1000;

const IDIOMAS = { pt: 'português do Brasil', en: 'English', es: 'español', fr: 'français', it: 'italiano' };

function json(corpo, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
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
  // só números: base do estudo de custo por foto
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

  // 1) teto da conta inteira por dia — protege o saldo
  const chaveDia = `dia:${dia}`;
  const usadosDia = await lerNumero(kv, chaveDia);
  if (usadosDia >= Number(env.MAX_FOTOS_DIA || 300)) return json({ erro: 'limite_servico' }, 429);

  // 2) limite por IP por hora — freia robôs que inventam ids de instalação
  const chaveIp = `ip:${ip}:${hora}`;
  const usadosIp = await lerNumero(kv, chaveIp);
  if (usadosIp >= Number(env.MAX_FOTOS_IP_HORA || 20)) return json({ erro: 'muitas_tentativas' }, 429);

  // 3) cota grátis da instalação: N fotos a cada 7 dias (janela móvel)
  // TODO(v0.4.x): assinante confirmado no RevenueCat ganha cota maior
  const chaveInst = `inst:${instalacao}`;
  const historico = ((await kv.get(chaveInst, 'json')) ?? []).filter((t) => agora - t < SETE_DIAS_MS);
  const limite = Number(env.FOTOS_GRATIS_7D || 2);
  if (historico.length >= limite) {
    const liberaEm = new Date(Math.min(...historico) + SETE_DIAS_MS).toISOString();
    return json({ erro: 'cota_esgotada', limite, liberaEm }, 402);
  }

  const resultado = await perguntarAoGemini(env, imagem, idioma);
  if (!resultado || resultado.falha) return json({ erro: 'falha_ia', motivo: resultado?.falha }, 502);

  // só conta a foto quando a IA respondeu
  historico.push(agora);
  await Promise.all([
    kv.put(chaveInst, JSON.stringify(historico), { expirationTtl: 8 * 24 * 3600 }),
    kv.put(chaveDia, String(usadosDia + 1), { expirationTtl: 3 * 24 * 3600 }),
    kv.put(chaveIp, String(usadosIp + 1), { expirationTtl: 2 * 3600 }),
  ]);

  return json({ ...resultado, restantes: Math.max(0, limite - historico.length) });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/v1/analisar-prato' && request.method === 'POST') {
      try {
        return await analisarPrato(request, env);
      } catch (e) {
        console.error('erro', e?.message);
        return json({ erro: 'interno' }, 500);
      }
    }
    if (pathname === '/health') return json({ ok: true });
    return json({ erro: 'nao_encontrado' }, 404);
  },
};
