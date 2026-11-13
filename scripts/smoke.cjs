#!/usr/bin/env node
/**
 * Smoke test SOMENTE DE LEITURA do Leviã em produção.
 *
 * Só faz GET, HEAD e OPTIONS (qualquer outro método lança erro antes de sair da máquina). Não manda
 * token, não cria conta, não envia foto, não chama rota administrativa e não grava nada: nenhum dado
 * real é usado. Serve antes e depois de publicar ou de fazer rollback.
 *
 *   node scripts/smoke.cjs                  # confere o que está no ar
 *   node scripts/smoke.cjs --sha <commit>   # exige o APP nesse commit (7 a 40 hex)
 *   node scripts/smoke.cjs --sha-worker <commit>  # exige o Worker nesse commit (só muda quando worker/** muda)
 *   node scripts/smoke.cjs --json           # saída em JSON (para outras ferramentas)
 *
 * Sai com código 0 se tudo passou e 1 se algo falhou.
 */
'use strict';

const PADRAO = {
  worker: 'https://levia-ia-worker.ferpa2505.workers.dev',
  app: 'https://leviapp.org',
  landing: 'https://www.leviapp.org',
};

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TEMPO_MAX_MS = 15000;
const SHA_COMPLETO = /^[0-9a-f]{40}$/;
const ORIGENS_PERMITIDAS = ['https://leviapp.org', 'https://www.leviapp.org'];
const ORIGENS_ESTRANHAS = ['https://evil.example', 'https://leviapp.org.evil.example', 'http://leviapp.org'];

/** Cria o cliente HTTP: só métodos de leitura e com tempo máximo por requisição. */
function criarCliente(fetchImpl) {
  return async function requisitar(url, { metodo = 'GET', headers = {} } = {}) {
    const verbo = String(metodo).toUpperCase();
    if (!METODOS_SEGUROS.has(verbo)) {
      throw new Error(`smoke somente leitura: método ${verbo} não é permitido`);
    }
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), TEMPO_MAX_MS);
    const inicio = Date.now();
    try {
      const resposta = await fetchImpl(url, {
        method: verbo,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; levia-smoke/1.0)', ...headers },
        redirect: 'manual',
        signal: controle.signal,
      });
      const texto = verbo === 'HEAD' || verbo === 'OPTIONS' ? '' : await resposta.text();
      return { status: resposta.status, headers: resposta.headers, texto, ms: Date.now() - inicio };
    } finally {
      clearTimeout(timer);
    }
  };
}

function json(texto) {
  try { return JSON.parse(texto); } catch { return null; }
}

/** Roda todas as checagens. `fetchImpl` e `alvos` são injetáveis para teste. */
async function executarSmoke({ fetchImpl = globalThis.fetch, alvos = PADRAO, sha = null, shaWorker = null } = {}) {
  const requisitar = criarCliente(fetchImpl);
  const resultados = [];
  const prefixo = sha ? String(sha).toLowerCase() : null;
  if (prefixo && !/^[0-9a-f]{7,40}$/.test(prefixo)) {
    throw new Error('--sha precisa ter de 7 a 40 caracteres hexadecimais');
  }
  const prefixoWorker = shaWorker ? String(shaWorker).toLowerCase() : null;
  if (prefixoWorker && !/^[0-9a-f]{7,40}$/.test(prefixoWorker)) {
    throw new Error('--sha-worker precisa ter de 7 a 40 caracteres hexadecimais');
  }

  async function checar(grupo, nome, funcao) {
    try {
      const detalhe = await funcao();
      resultados.push({ grupo, nome, ok: true, detalhe: detalhe ?? '' });
    } catch (e) {
      resultados.push({ grupo, nome, ok: false, detalhe: e?.message ?? String(e) });
    }
  }
  const exigir = (condicao, mensagem) => { if (!condicao) throw new Error(mensagem); };
  const W = alvos.worker.replace(/\/$/, '');
  const A = alvos.app.replace(/\/$/, '');
  const L = alvos.landing.replace(/\/$/, '');

  // ---------- Worker ----------
  await checar('worker', '/health responde {"ok":true}', async () => {
    const r = await requisitar(`${W}/health`);
    exigir(r.status === 200, `status ${r.status}`);
    exigir(json(r.texto)?.ok === true, `corpo inesperado: ${r.texto.slice(0, 60)}`);
    return `${r.ms} ms`;
  });

  await checar('worker', '/versao informa o commit publicado', async () => {
    const r = await requisitar(`${W}/versao`);
    exigir(r.status === 200, `status ${r.status}`);
    const commit = json(r.texto)?.commit;
    exigir(typeof commit === 'string' && SHA_COMPLETO.test(commit), `commit inválido ou "desconhecido": ${String(commit).slice(0, 12)}`);
    // o Worker só é republicado quando worker/** muda: pode ficar atrás do app, então só exige commit com --sha-worker
    if (prefixoWorker) exigir(commit.startsWith(prefixoWorker), `Worker está em ${commit.slice(0, 7)}, esperado ${prefixoWorker.slice(0, 7)}`);
    return commit.slice(0, 7);
  });

  await checar('worker', 'rota inexistente devolve 404 sem vazar detalhe', async () => {
    const r = await requisitar(`${W}/rota-que-nao-existe`);
    exigir(r.status === 404, `status ${r.status}`);
    exigir(json(r.texto)?.erro === 'nao_encontrado', `corpo inesperado: ${r.texto.slice(0, 60)}`);
  });

  await checar('worker', 'sitekey do Turnstile expõe só a chave pública', async () => {
    const r = await requisitar(`${W}/v1/turnstile/sitekey`, { headers: { Origin: ORIGENS_PERMITIDAS[0] } });
    exigir(r.status === 200, `status ${r.status}`);
    const corpo = json(r.texto);
    exigir(corpo && Object.keys(corpo).join() === 'sitekey' && typeof corpo.sitekey === 'string' && corpo.sitekey, 'corpo deve ter só "sitekey"');
    exigir(r.headers.get('access-control-allow-origin') === ORIGENS_PERMITIDAS[0], 'CORS não devolveu a origem do app');
  });

  for (const origem of ORIGENS_PERMITIDAS) {
    await checar('cors', `preflight aceita ${origem}`, async () => {
      const r = await requisitar(`${W}/v1/ativar`, {
        metodo: 'OPTIONS',
        headers: { Origin: origem, 'Access-Control-Request-Method': 'POST' },
      });
      exigir(r.status === 204, `status ${r.status}`);
      const permitido = r.headers.get('access-control-allow-origin');
      exigir(permitido === origem, `Allow-Origin=${permitido}`);
      exigir(permitido !== '*', 'não pode ser curinga');
      exigir(/origin/i.test(r.headers.get('vary') ?? ''), 'falta Vary: Origin');
      exigir(r.headers.get('access-control-allow-credentials') === null, 'não deve permitir credenciais');
    });
  }

  for (const origem of ORIGENS_ESTRANHAS) {
    await checar('cors', `preflight recusa ${origem}`, async () => {
      const r = await requisitar(`${W}/v1/ativar`, {
        metodo: 'OPTIONS',
        headers: { Origin: origem, 'Access-Control-Request-Method': 'POST' },
      });
      exigir(r.headers.get('access-control-allow-origin') === null, `devolveu Allow-Origin=${r.headers.get('access-control-allow-origin')}`);
      exigir(r.headers.get('access-control-allow-methods') === null, 'devolveu Allow-Methods');
    });
  }

  // ---------- App ----------
  for (const caminho of ['/', '/ativar']) {
    await checar('app', `${caminho} carrega (título Leviã)`, async () => {
      const r = await requisitar(`${A}${caminho}`);
      exigir(r.status === 200, `status ${r.status}`);
      exigir(r.texto.includes('<title>Leviã</title>'), 'título "Leviã" não encontrado');
      return `${r.ms} ms`;
    });
  }

  await checar('app', 'manifesto PWA válido', async () => {
    const r = await requisitar(`${A}/manifest.webmanifest`);
    exigir(r.status === 200, `status ${r.status}`);
    exigir(json(r.texto)?.short_name, 'sem short_name');
  });

  await checar('app', 'sw.js carimbado com o commit e sem cache', async () => {
    const r = await requisitar(`${A}/sw.js`);
    exigir(r.status === 200, `status ${r.status}`);
    const carimbo = (r.texto.match(/const CACHE = 'levia-v2-([0-9a-f]{7})'/) ?? [])[1];
    exigir(carimbo, 'carimbo levia-v2-<commit> não encontrado (publicado sem passar pelo workflow?)');
    if (prefixo) exigir(prefixo.startsWith(carimbo) || carimbo === prefixo.slice(0, 7), `app está em ${carimbo}, esperado ${prefixo.slice(0, 7)}`);
    exigir(/no-cache/i.test(r.headers.get('cache-control') ?? ''), 'sw.js deve ter Cache-Control: no-cache');
    return carimbo;
  });

  for (const icone of ['/icons/icon-192.png', '/icons/icon-512.png']) {
    await checar('app', `${icone} existe`, async () => {
      const r = await requisitar(`${A}${icone}`, { metodo: 'HEAD' });
      exigir(r.status === 200, `status ${r.status}`);
      exigir(/image\/png/i.test(r.headers.get('content-type') ?? ''), `content-type ${r.headers.get('content-type')}`);
    });
  }

  await checar('app', 'cabeçalhos de segurança presentes', async () => {
    const r = await requisitar(`${A}/`, { metodo: 'HEAD' });
    exigir(/nosniff/i.test(r.headers.get('x-content-type-options') ?? ''), 'falta X-Content-Type-Options: nosniff');
    exigir(r.headers.get('referrer-policy'), 'falta Referrer-Policy');
    const csp = r.headers.get('content-security-policy') ?? '';
    exigir(/frame-ancestors 'none'/.test(csp), "CSP sem frame-ancestors 'none'");
    exigir(/object-src 'none'/.test(csp), "CSP sem object-src 'none'");
  });

  // ---------- Landing ----------
  await checar('landing', '/ carrega (HTML)', async () => {
    const r = await requisitar(`${L}/`);
    exigir(r.status === 200, `status ${r.status}`);
    exigir(/<html/i.test(r.texto), 'não parece HTML');
    return `${r.ms} ms`;
  });

  await checar('landing', '/versao.json informa o commit publicado', async () => {
    const r = await requisitar(`${L}/versao.json`);
    exigir(r.status === 200, `status ${r.status}`);
    const commit = json(r.texto)?.commit;
    exigir(typeof commit === 'string' && SHA_COMPLETO.test(commit), 'commit inválido');
    return commit.slice(0, 7); // a landing só muda com site/landing: pode ficar atrás do app, por isso não exige --sha nem --sha-worker
  });

  return resultados;
}

function formatar(resultados) {
  const linhas = [];
  let grupo = '';
  for (const r of resultados) {
    if (r.grupo !== grupo) { grupo = r.grupo; linhas.push(`\n[${grupo}]`); }
    linhas.push(`  ${r.ok ? 'OK    ' : 'FALHOU'}  ${r.nome}${r.detalhe ? `  (${r.detalhe})` : ''}`);
  }
  const falhas = resultados.filter((r) => !r.ok).length;
  linhas.push(`\n${resultados.length - falhas} de ${resultados.length} checagens passaram${falhas ? `; ${falhas} falharam.` : '.'}`);
  return linhas.join('\n');
}

function lerArgumentos(argv) {
  const opcoes = { sha: null, shaWorker: null, json: false, alvos: { ...PADRAO } };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opcoes.json = true;
    else if (a === '--sha') opcoes.sha = argv[++i] ?? '';
    else if (a === '--sha-worker') opcoes.shaWorker = argv[++i] ?? '';
    else if (a === '--worker-url') opcoes.alvos.worker = argv[++i] ?? '';
    else if (a === '--app-url') opcoes.alvos.app = argv[++i] ?? '';
    else if (a === '--landing-url') opcoes.alvos.landing = argv[++i] ?? '';
    else throw new Error(`argumento desconhecido: ${a}`);
  }
  for (const [nome, url] of Object.entries(opcoes.alvos)) {
    if (!/^https:\/\/[^/\s]+\/?$/.test(url)) throw new Error(`--${nome}-url precisa ser https://dominio (recebi "${url}")`);
  }
  if (opcoes.sha === '') throw new Error('--sha precisa de um valor');
  if (opcoes.shaWorker === '') throw new Error('--sha-worker precisa de um valor');
  return opcoes;
}

async function principal(argv) {
  const opcoes = lerArgumentos(argv);
  const resultados = await executarSmoke({ alvos: opcoes.alvos, sha: opcoes.sha, shaWorker: opcoes.shaWorker });
  console.log(opcoes.json ? JSON.stringify(resultados, null, 2) : formatar(resultados));
  return resultados.every((r) => r.ok) ? 0 : 1;
}

module.exports = { executarSmoke, formatar, lerArgumentos, criarCliente, METODOS_SEGUROS };

if (require.main === module) {
  principal(process.argv.slice(2)).then((codigo) => { process.exitCode = codigo; }, (e) => {
    console.error(`erro: ${e.message}`);
    process.exitCode = 2;
  });
}
