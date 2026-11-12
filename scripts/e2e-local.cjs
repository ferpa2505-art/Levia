#!/usr/bin/env node
/**
 * Teste de ponta a ponta LOCAL dos fluxos que o smoke de produção não cobre (escrita).
 *
 * Sobe o Worker de verdade (runtime workerd via `wrangler dev --local`) com um D1 e um KV locais, descartáveis,
 * e percorre: webhook da Hotmart (compra, repetição, reembolso) → serial → ativação de aparelho → limites →
 * rotas administrativas fechadas. NÃO toca a produção: não usa nenhum segredo real (todos são gerados na hora),
 * nenhuma conta da Cloudflare e nenhum dado real (telefone e e-mail fictícios).
 *
 *   node scripts/e2e-local.cjs
 *
 * Precisa de Node 22+ e de internet só para o `npx` baixar o wrangler (e o workerd) na primeira vez.
 * Sai com 0 se tudo passou, 1 se algo falhou.
 */
'use strict';

const { spawn, execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PORTA = Number(process.env.E2E_PORT || 8799);
const BASE = `http://127.0.0.1:${PORTA}`;
const WORKER_DIR = path.join(__dirname, '..', 'worker');
const WINDOWS = process.platform === 'win32';
// banco/KV locais fora do worker/: o `wrangler dev` recarrega o Worker quando algo muda dentro da pasta dele
const ESTADO = fs.mkdtempSync(path.join(os.tmpdir(), 'levia-e2e-'));

// Sem shell (argumentos nunca viram comando): no Windows chama o npx-cli.js do próprio Node.
const NPX_CLI = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
const NPX = fs.existsSync(NPX_CLI) ? { cmd: process.execPath, pre: [NPX_CLI] } : { cmd: 'npx', pre: [] };

// Segredos descartáveis desta execução (nunca valores reais).
const segredo = () => crypto.randomBytes(24).toString('base64url');
const SEGREDOS = {
  HOTMART_HOTTOK: segredo(),
  TYPEBOT_PHONE_HMAC_KEY: segredo(),
  EMAIL_HASH_KEY: segredo(),
  LICENCA_TOKEN_KEY: segredo(),
  ADMIN_TOKEN: segredo(),
  GEMINI_API_KEY: segredo(), // falsa: só seria usada depois de uma licença válida, e o teste não envia nenhuma foto
};
const TELEFONE = '+5511900000099'; // fictício
const PRODUTO_MENSAL = '8875689'; // PRODUTOS_MENSAL do wrangler.toml (valor de teste do plano mensal)

const resultados = [];
function registrar(nome, ok, detalhe = '') {
  resultados.push({ nome, ok, detalhe });
  console.log(`  ${ok ? 'OK    ' : 'FALHOU'}  ${nome}${detalhe && !ok ? `  (${detalhe})` : ''}`);
}
async function passo(nome, funcao) {
  try { await funcao(); registrar(nome, true); } catch (e) { registrar(nome, false, e.message); }
}
const exigir = (cond, msg) => { if (!cond) throw new Error(msg); };

function wrangler(args, opcoes = {}) {
  return spawn(NPX.cmd, [...NPX.pre, '--yes', 'wrangler@4', ...args], { cwd: WORKER_DIR, ...opcoes });
}
function wranglerSync(args) {
  return execFileSync(NPX.cmd, [...NPX.pre, '--yes', 'wrangler@4', ...args], {
    cwd: WORKER_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 20 * 1024 * 1024,
  });
}

function consultarD1(sql) {
  const arquivo = path.join(ESTADO, `consulta-${crypto.randomBytes(4).toString('hex')}.sql`);
  fs.writeFileSync(arquivo, sql);
  const saida = wranglerSync(['d1', 'execute', 'LEVIA_DB', '--local', '--persist-to', ESTADO, '--json', '--file', arquivo]);
  const inicio = saida.indexOf('[');
  const dados = JSON.parse(saida.slice(inicio));
  return dados[0]?.results ?? [];
}

async function req(caminho, { metodo = 'GET', headers = {}, corpo } = {}) {
  // o `d1 execute` local mexe no mesmo banco do `wrangler dev` e o Worker pode ficar indisponível por instantes:
  // só erro de rede é repetido (resposta HTTP, de qualquer status, nunca é repetida)
  let r;
  for (let tentativa = 1; ; tentativa++) {
    try {
      r = await fetch(BASE + caminho, {
        method: metodo,
        headers: { ...(corpo ? { 'Content-Type': 'application/json' } : {}), ...headers },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      break;
    } catch (e) {
      if (tentativa >= 6) throw e;
      await new Promise((ok) => setTimeout(ok, 2000));
    }
  }
  const texto = await r.text();
  let json = null;
  try { json = JSON.parse(texto); } catch { /* resposta não-JSON */ }
  return { status: r.status, json, texto, headers: r.headers };
}

function webhook(evento, transacao, hottok) {
  return req('/v1/hotmart/webhook', {
    metodo: 'POST',
    headers: hottok ? { 'X-HOTMART-HOTTOK': hottok } : {},
    corpo: {
      event: evento,
      data: {
        product: { id: Number(PRODUTO_MENSAL), name: 'Plano mensal (teste)' },
        purchase: { transaction: transacao, status: evento === 'PURCHASE_APPROVED' ? 'APPROVED' : 'REFUNDED', price: { value: 19.97, currency_value: 'BRL' } },
        buyer: { checkout_phone: TELEFONE, name: 'Teste Ficticio' },
      },
    },
  });
}

async function esperarNoAr(processo, limiteMs = 120000) {
  const fim = Date.now() + limiteMs;
  while (Date.now() < fim) {
    if (processo.exitCode !== null) throw new Error('o wrangler dev encerrou antes de subir');
    try { const r = await fetch(`${BASE}/health`); if (r.ok) return; } catch { /* ainda subindo */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('o Worker local não respondeu a tempo');
}

function encerrar(processo) {
  try {
    if (WINDOWS && processo.pid) execFileSync('taskkill', ['/pid', String(processo.pid), '/T', '/F'], { stdio: 'ignore' });
    else processo.kill('SIGTERM');
  } catch { /* já encerrado */ }
  try { fs.rmSync(ESTADO, { recursive: true, force: true }); } catch { /* o Windows pode segurar o arquivo por um instante */ }
}

async function principal() {
  console.log('Teste de ponta a ponta LOCAL (nada é enviado à produção)\n');
  console.log('Preparando o banco local e subindo o Worker...');
  wranglerSync(['d1', 'migrations', 'apply', 'LEVIA_DB', '--local', '--persist-to', ESTADO]);

  const vars = Object.entries(SEGREDOS).flatMap(([k, v]) => ['--var', `${k}:${v}`]);
  const processo = wrangler(['dev', '--local', '--port', String(PORTA), '--persist-to', ESTADO, ...vars], { stdio: ['ignore', 'pipe', 'pipe'] });
  let saidaErro = '';
  processo.stderr.on('data', (d) => { saidaErro = (saidaErro + d).slice(-4000); });
  processo.stdout.on('data', () => {});

  try {
    await esperarNoAr(processo);
    console.log('');

    console.log('[basico]');
    await passo('/health e /versao respondem', async () => {
      const h = await req('/health'); exigir(h.status === 200 && h.json?.ok === true, `health ${h.status}`);
      const v = await req('/versao'); exigir(v.status === 200 && typeof v.json?.commit === 'string', `versao ${v.texto}`);
    });

    console.log('\n[webhook da Hotmart]');
    await passo('sem hottok ou com hottok errado: 401', async () => {
      const a = await webhook('PURCHASE_APPROVED', 'HP-E2E-0');
      const b = await webhook('PURCHASE_APPROVED', 'HP-E2E-0', 'errado');
      exigir(a.status === 401 && b.status === 401, `status ${a.status}/${b.status}`);
    });
    await passo('compra aprovada com o hottok certo libera o plano mensal', async () => {
      const r = await webhook('PURCHASE_APPROVED', 'HP-E2E-1', SEGREDOS.HOTMART_HOTTOK);
      exigir(r.status === 200 && r.json?.plano === 'monthly', `${r.status} ${r.texto.slice(0, 120)}`);
    });

    let serial = null;
    await passo('o serial sai pela fila do WhatsApp (e só ali)', async () => {
      const linhas = consultarD1("SELECT texto FROM wa_outbox WHERE phone LIKE '%900000099%' ORDER BY criado_em");
      exigir(linhas.length >= 2, `${linhas.length} mensagens na fila`);
      const achado = linhas.map((l) => String(l.texto).match(/\b[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}\b/)).find(Boolean);
      exigir(achado, 'serial não encontrado na fila');
      serial = achado[0];
      const guardado = consultarD1('SELECT code_hash FROM activation_codes');
      exigir(guardado.length >= 1 && !JSON.stringify(guardado).includes(serial.replace(/-/g, '')), 'o banco não pode guardar o serial em texto');
    });
    await passo('repetir a mesma compra não gera outro serial (idempotente)', async () => {
      const antes = consultarD1('SELECT COUNT(*) AS n FROM activation_codes')[0].n;
      const r = await webhook('PURCHASE_APPROVED', 'HP-E2E-1', SEGREDOS.HOTMART_HOTTOK);
      const depois = consultarD1('SELECT COUNT(*) AS n FROM activation_codes')[0].n;
      exigir(r.status === 200 && antes === depois, `${r.status}; códigos ${antes} -> ${depois}`);
    });

    console.log('\n[ativacao do serial]');
    const aparelho = () => crypto.randomUUID();
    let licenca = null;
    await passo('serial inválido é recusado (403)', async () => {
      const r = await req('/v1/ativar', { metodo: 'POST', corpo: { serial: 'AAAA-BBBB-CCCC-DDDD', instalacao: aparelho() } });
      exigir(r.status === 403, `status ${r.status}`);
    });
    await passo('serial válido ativa o aparelho 1 e devolve a licença assinada', async () => {
      const r = await req('/v1/ativar', { metodo: 'POST', corpo: { serial, instalacao: aparelho() } });
      exigir(r.status === 200 && r.json?.ok && typeof r.json.licenca === 'string' && r.json.licenca.length > 40, `${r.status} ${r.texto.slice(0, 80)}`);
      exigir(typeof r.json.plano === 'string' && r.json.plano.length > 0, `plano ausente: ${JSON.stringify({ ...r.json, licenca: '...' })}`);
      exigir(Number(r.json.fotos) > 0, `limite de fotos ausente: ${r.json.fotos}`);
      licenca = r.json.licenca;
    });
    await passo('aparelho 2 ativa; o 3º é barrado pelo limite de dispositivos (409)', async () => {
      const dois = await req('/v1/ativar', { metodo: 'POST', corpo: { serial, instalacao: aparelho() } });
      const tres = await req('/v1/ativar', { metodo: 'POST', corpo: { serial, instalacao: aparelho() } });
      exigir(dois.status === 200, `aparelho 2: ${dois.status}`);
      exigir(tres.status === 409 && tres.json?.erro === 'limite_dispositivos', `aparelho 3: ${tres.status} ${tres.texto.slice(0, 80)}`);
    });
    await passo('análise de foto sem licença válida é recusada antes de gastar IA', async () => {
      const r = await req('/v1/analisar-prato', { metodo: 'POST', corpo: { instalacao: aparelho(), licenca: 'invalida', imagem: 'x' } });
      exigir([400, 401, 403].includes(r.status), `status ${r.status}`);
    });

    console.log('\n[reembolso]');
    await passo('reembolso revoga o acesso e invalida o serial', async () => {
      const r = await webhook('PURCHASE_REFUNDED', 'HP-E2E-1', SEGREDOS.HOTMART_HOTTOK);
      exigir(r.status === 200 && r.json?.revogado === true, `${r.status} ${r.texto.slice(0, 100)}`);
      const nova = await req('/v1/ativar', { metodo: 'POST', corpo: { serial, instalacao: aparelho() } });
      exigir(nova.status === 403, `ativar depois do reembolso: ${nova.status}`);
    });

    console.log('\n[rotas administrativas]');
    await passo('sem token ou com token errado: 401; com o token certo passa da autenticação', async () => {
      const sem = await req('/v1/admin/pagina/insights');
      const errado = await req('/v1/admin/pagina/insights', { headers: { Authorization: 'Bearer errado' } });
      exigir(sem.status === 401 && errado.status === 401, `status ${sem.status}/${errado.status}`);
      const certo = await req('/v1/admin/pagina/insights', { headers: { Authorization: `Bearer ${SEGREDOS.ADMIN_TOKEN}` } });
      // sem FB_PAGE_ID/FB_PAGE_TOKEN a Página não está configurada: 503 prova que autenticou e parou na Meta (que nem é chamada)
      exigir(certo.status === 503 && certo.json?.erro === 'pagina_nao_configurada', `${certo.status} ${certo.texto.slice(0, 100)}`);
    });
    await passo('a auditoria grava as chamadas e nunca o token', async () => {
      const linhas = consultarD1('SELECT rota, status, motivo, detalhe FROM admin_auditoria');
      exigir(linhas.length >= 1, 'nenhuma linha de auditoria');
      exigir(!JSON.stringify(linhas).includes(SEGREDOS.ADMIN_TOKEN), 'o token apareceu na auditoria');
    });

    console.log('\n[CORS]');
    await passo('origem estranha não recebe Allow-Origin; a do app recebe', async () => {
      const ruim = await req('/v1/ativar', { metodo: 'OPTIONS', headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' } });
      const bom = await req('/v1/ativar', { metodo: 'OPTIONS', headers: { Origin: 'https://leviapp.org', 'Access-Control-Request-Method': 'POST' } });
      exigir(ruim.headers.get('access-control-allow-origin') === null, 'devolveu Allow-Origin para origem estranha');
      exigir(bom.headers.get('access-control-allow-origin') === 'https://leviapp.org', 'não devolveu a origem do app');
    });
  } catch (e) {
    registrar('preparação do ambiente local', false, `${e.message}${saidaErro ? ` | ${saidaErro.slice(-300)}` : ''}`);
  } finally {
    encerrar(processo);
  }

  const falhas = resultados.filter((r) => !r.ok).length;
  console.log(`\n${resultados.length - falhas} de ${resultados.length} checagens passaram${falhas ? `; ${falhas} falharam.` : '.'}`);
  return falhas ? 1 : 0;
}

principal().then((c) => { process.exitCode = c; }, (e) => { console.error(`erro: ${e.message}`); process.exitCode = 2; });
