#!/usr/bin/env node
/**
 * Gera um serial na mão (para você, testadores ou clientes antes do WhatsApp estar no ar).
 * Não toca no banco: escreve um arquivo .sql que você roda com o wrangler.
 *
 *   node worker/scripts/serial-manual.cjs "Nome de quem recebe" [dias de validade do serial]
 *   npx wrangler d1 execute levia-licencas-dev --remote --file=serial-<id>.sql
 *
 * O serial aparece só aqui no terminal; o banco guarda apenas o hash (sha256).
 * O teste de 7 dias começa quando a pessoa ativa o serial no app.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // igual a worker/src/serial.js

function gerarSerial() {
  return [...crypto.randomBytes(16)].map((b) => ALFABETO[b & 31]).join('');
}

function montarSql({ nome, dias = 30, agora = Date.now(), serial = gerarSerial() }) {
  const iso = new Date(agora).toISOString();
  const expira = new Date(agora + dias * 24 * 3600 * 1000).toISOString();
  const contaId = crypto.randomUUID();
  const codigoId = crypto.randomUUID();
  // accounts exige um email_hash único; para conta manual ele é só uma marca aleatória derivada do nome
  const marca = crypto.createHash('sha256').update(`manual:${nome}:${contaId}`).digest('hex');
  const codeHash = crypto.createHash('sha256').update(serial).digest('hex');
  const sql = [
    `INSERT INTO accounts (id, email_hash, created_at, updated_at) VALUES ('${contaId}', '${marca}', '${iso}', '${iso}');`,
    `INSERT INTO activation_codes (id, account_id, code_hash, issued_at, expires_at) VALUES ('${codigoId}', '${contaId}', '${codeHash}', '${iso}', '${expira}');`,
    '',
  ].join('\n');
  return { sql, serial, serialFormatado: serial.match(/.{4}/g).join('-'), contaId, expira };
}

module.exports = { montarSql, gerarSerial };

if (require.main === module) {
  const nome = (process.argv[2] || '').trim();
  const dias = Number(process.argv[3] || 30);
  if (!nome || !(dias > 0 && dias <= 365)) {
    console.error('Uso: node worker/scripts/serial-manual.cjs "Nome" [dias 1-365]');
    process.exit(1);
  }
  const r = montarSql({ nome, dias });
  const arquivo = path.resolve(`serial-${r.contaId.slice(0, 8)}.sql`);
  fs.writeFileSync(arquivo, r.sql);
  console.log(`Serial: ${r.serialFormatado}   (vale até ${r.expira})`);
  console.log(`Arquivo SQL: ${arquivo}`);
  console.log(`Rode: npx wrangler d1 execute levia-licencas-dev --remote --file="${arquivo}"`);
  console.log('Depois apague o arquivo .sql. Guarde o serial: ele não pode ser recuperado depois.');
}
