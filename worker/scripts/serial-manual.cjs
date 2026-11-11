#!/usr/bin/env node
/**
 * Gera seriais na mão (para você, testadores ou clientes antes do WhatsApp/cobrança estarem no ar).
 * Não toca no banco: escreve um arquivo .sql que você roda com o wrangler (ou cola no Console do D1).
 *
 *   # um serial com teste de 7 dias (começa quando a pessoa ativa)
 *   node worker/scripts/serial-manual.cjs "Nome de quem recebe" [dias de validade do serial]
 *
 *   # seriais VITALÍCIOS: acesso sem data de fim (assinatura ativa), 100 fotos a cada 30 dias
 *   node worker/scripts/serial-manual.cjs "Nome" --vitalicio --quantidade 10 [--fotos 100] [--saida pasta]
 *
 *   npx wrangler d1 execute levia-licencas-dev --remote --file=<arquivo.sql>
 *
 * O banco guarda só o hash (sha256) do serial. Com --saida, os seriais vão para um .txt na pasta
 * (não aparecem no terminal); sem ela, aparecem aqui. Guarde-os: não dá para recuperar depois.
 *
 * Como o vitalício funciona: o serial (activation_codes) é o que a pessoa digita no app; o
 * entitlement com current_period_end vazio (NULL) é o que mantém o acesso, sem vencer nunca.
 * A licença que o app guarda vale 365 dias; passado esse prazo o app pede o serial de novo, e por
 * isso o serial vitalício fica válido por 10 anos para poder ser digitado outra vez.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // igual a worker/src/serial.js
const UM_DIA_MS = 24 * 3600 * 1000;
const DIAS_VITALICIO = 3650;

function gerarSerial() {
  return [...crypto.randomBytes(16)].map((b) => ALFABETO[b & 31]).join('');
}

function montarSql({ nome, dias, vitalicio = false, fotos = 100, agora = Date.now(), serial = gerarSerial() }) {
  const validade = dias ?? (vitalicio ? DIAS_VITALICIO : 30);
  const iso = new Date(agora).toISOString();
  const expira = new Date(agora + validade * UM_DIA_MS).toISOString();
  const contaId = crypto.randomUUID();
  const codigoId = crypto.randomUUID();
  // accounts exige um email_hash único; para conta manual ele é só uma marca aleatória derivada do nome
  const marca = crypto.createHash('sha256').update(`manual:${nome}:${contaId}`).digest('hex');
  const codeHash = crypto.createHash('sha256').update(serial).digest('hex');
  const linhas = [
    `INSERT INTO accounts (id, email_hash, created_at, updated_at) VALUES ('${contaId}', '${marca}', '${iso}', '${iso}');`,
    `INSERT INTO activation_codes (id, account_id, code_hash, issued_at, expires_at) VALUES ('${codigoId}', '${contaId}', '${codeHash}', '${iso}', '${expira}');`,
  ];
  if (vitalicio) {
    // plan só aceita 'monthly' ou 'annual'; sem fim (NULL) o acesso não vence; a marca permite achar depois
    linhas.push(
      `INSERT INTO entitlements (id, account_id, plan, status, photo_limit, photo_used, current_period_start, current_period_end, provider_subscription_id, created_at, updated_at) ` +
      `VALUES ('${crypto.randomUUID()}', '${contaId}', 'annual', 'active', ${Number(fotos)}, 0, '${iso}', NULL, 'vitalicio-manual', '${iso}', '${iso}');`,
    );
  }
  linhas.push('');
  return { sql: linhas.join('\n'), serial, serialFormatado: serial.match(/.{4}/g).join('-'), contaId, expira };
}

/** Várias contas num só arquivo .sql. */
function montarLote({ nome, quantidade = 1, ...resto }) {
  const itens = [];
  for (let i = 1; i <= quantidade; i++) {
    itens.push({ nome: quantidade > 1 ? `${nome} ${i}` : nome, ...montarSql({ nome: quantidade > 1 ? `${nome} ${i}` : nome, ...resto }) });
  }
  return { itens, sql: itens.map((i) => i.sql).join('\n') };
}

module.exports = { montarSql, montarLote, gerarSerial };

function lerArgumentos(argv) {
  const positivos = [];
  const opcoes = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--vitalicio') opcoes.vitalicio = true;
    else if (['--quantidade', '--fotos', '--saida'].includes(a)) opcoes[a.slice(2)] = argv[++i];
    else positivos.push(a);
  }
  return { positivos, opcoes };
}

if (require.main === module) {
  const { positivos, opcoes } = lerArgumentos(process.argv.slice(2));
  const nome = (positivos[0] || '').trim();
  const vitalicio = !!opcoes.vitalicio;
  const dias = positivos[1] ? Number(positivos[1]) : undefined;
  const quantidade = Number(opcoes.quantidade || 1);
  const fotos = Number(opcoes.fotos || 100);
  const limiteDias = vitalicio ? DIAS_VITALICIO : 365;
  const invalido =
    !nome || !(quantidade >= 1 && quantidade <= 100) || !(fotos >= 1 && fotos <= 10000) ||
    (dias !== undefined && !(dias > 0 && dias <= limiteDias));
  if (invalido) {
    console.error('Uso: node worker/scripts/serial-manual.cjs "Nome" [dias] [--vitalicio] [--quantidade 1-100] [--fotos 1-10000] [--saida pasta]');
    process.exit(1);
  }
  const lote = montarLote({ nome, quantidade, vitalicio, fotos, dias });
  const pasta = path.resolve(opcoes.saida || '.');
  fs.mkdirSync(pasta, { recursive: true });
  const carimbo = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const arquivo = path.join(pasta, `seriais-${carimbo}.sql`);
  fs.writeFileSync(arquivo, lote.sql);

  const rotulo = vitalicio ? 'vitalício (sem fim)' : 'teste de 7 dias na ativação';
  if (opcoes.saida) {
    const arquivoSeriais = path.join(pasta, `seriais-${carimbo}.txt`);
    fs.writeFileSync(arquivoSeriais, lote.itens.map((i) => `${i.nome}\t${i.serialFormatado}`).join('\n') + '\n');
    console.log(`${lote.itens.length} serial(is) ${rotulo}. Lista (guarde): ${arquivoSeriais}`);
  } else {
    for (const i of lote.itens) console.log(`${i.nome}: ${i.serialFormatado}   (serial vale até ${i.expira})`);
  }
  console.log(`Arquivo SQL: ${arquivo}`);
  console.log(`Rode (na pasta worker): npx wrangler d1 execute levia-licencas-dev --remote --file="${arquivo}"`);
  console.log('Depois apague o arquivo .sql. Os seriais não podem ser recuperados depois.');
}
