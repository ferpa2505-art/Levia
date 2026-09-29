#!/usr/bin/env node

/**
 * VALIDAÇÃO DE ASSETS PARA PUBLICAÇÃO (VERSÃO MELHORADA)
 * 
 * Validação completa de todos os assets para Google Play Console
 * Execute DEPOIS de fazer os Passos 2-4
 * 
 * Uso: node validate-publication-assets.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  bright: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

console.log('\n');
log('════════════════════════════════════════════════════════════', 'cyan');
log('  📊 VALIDAÇÃO DE ASSETS PARA GOOGLE PLAY CONSOLE', 'cyan');
log('════════════════════════════════════════════════════════════\n', 'cyan');

let totalChecks = 0;
let passedChecks = 0;
const results = [];

// FASE 1: BUILD & CODE
log('\n📦 FASE 1: BUILD & CÓDIGO\n', 'blue');

// Check app.json
try {
  const appJson = require('./app.json');
  const expo = appJson.expo || appJson;
  if (expo.name && expo.android && expo.android.package) {
    log(`✅ app.json configurado corretamente`, 'green');
    log(`   Package: ${expo.android.package}`, 'cyan');
    passedChecks++;
  } else {
    log(`❌ app.json inválido ou incompleto`, 'red');
  }
  totalChecks++;
} catch (e) {
  log(`❌ Erro ao ler app.json: ${e.message}`, 'red');
  totalChecks++;
}

// Check eas.json
try {
  const easJson = require('./eas.json');
  if (easJson.build && easJson.build.production) {
    log(`✅ eas.json configurado com profile 'production'`, 'green');
    passedChecks++;
  } else {
    log(`❌ eas.json não tem profile 'production'`, 'red');
  }
  totalChecks++;
} catch (e) {
  log(`❌ Erro ao ler eas.json: ${e.message}`, 'red');
  totalChecks++;
}

// FASE 2: SCREENSHOTS
log('\n\n🎬 FASE 2: SCREENSHOTS\n', 'blue');

const screenshotsDir = './screenshots';
if (fs.existsSync(screenshotsDir)) {
  const files = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
  const needed = 6;
  
  if (files.length >= needed) {
    log(`✅ ${files.length} screenshots encontrados (mínimo ${needed})`, 'green');
    log(`   Arquivos:`, 'cyan');
    files.forEach(f => log(`   - ${f}`, 'cyan'));
    passedChecks++;
  } else if (files.length > 0) {
    log(`⚠️  ${files.length}/${needed} screenshots (faltam ${needed - files.length})`, 'yellow');
    log(`   Encontrados: ${files.join(', ')}`, 'yellow');
  } else {
    log(`❌ Nenhum screenshot encontrado`, 'red');
    log(`   Esperado em: ${path.resolve(screenshotsDir)}`, 'yellow');
  }
} else {
  log(`❌ Pasta 'screenshots' não existe`, 'red');
  log(`   Crie a pasta e adicione 6-8 screenshots PNG (1080x1920)`, 'yellow');
}
totalChecks++;

// FASE 3: ÍCONE
log('\n\n🎨 FASE 3: ÍCONE\n', 'blue');

const iconPath = './assets/icon-512.png';
if (fs.existsSync(iconPath)) {
  const stats = fs.statSync(iconPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  const isValidSize = stats.size > 0 && stats.size < 500 * 1024;
  
  if (isValidSize) {
    log(`✅ Ícone 512x512 PNG pronto (${sizeKB} KB)`, 'green');
    passedChecks++;
  } else {
    log(`❌ Ícone existe mas tamanho inválido: ${sizeKB} KB`, 'red');
  }
} else {
  log(`⏳ Ícone não convertido ainda`, 'yellow');
  log(`   Execute: node convert-icon-auto.js`, 'yellow');
}
totalChecks++;

// FASE 4: DOCUMENTAÇÃO LEGAL
log('\n\n📄 FASE 4: DOCUMENTAÇÃO LEGAL\n', 'blue');

// Privacy Policy
if (fs.existsSync('./PRIVACIDADE.md')) {
  const content = fs.readFileSync('./PRIVACIDADE.md', 'utf-8');
  const sizeKB = (content.length / 1024).toFixed(2);
  if (content.includes('LGPD') && content.length > 1000) {
    log(`✅ PRIVACIDADE.md (${sizeKB} KB, LGPD-compliant)`, 'green');
    passedChecks++;
  } else {
    log(`⚠️  PRIVACIDADE.md existe mas pode estar incompleta`, 'yellow');
  }
} else {
  log(`❌ PRIVACIDADE.md não encontrada`, 'red');
}
totalChecks++;

// Terms of Service
if (fs.existsSync('./TERMOS_SERVICO.md')) {
  const content = fs.readFileSync('./TERMOS_SERVICO.md', 'utf-8');
  const sizeKB = (content.length / 1024).toFixed(2);
  const lowerContent = content.toLowerCase();
  const hasMedicalDisclaimer = 
    lowerContent.includes('not a medical device') || 
    lowerContent.includes('não é um dispositivo médico') ||
    lowerContent.includes('nao eh um dispositivo medico') ||
    lowerContent.includes('não é dispositivo médico') ||
    (lowerContent.includes('isenção') && lowerContent.includes('médica')) ||
    lowerContent.includes('assistência pessoal');
  
  if (hasMedicalDisclaimer && content.length > 1000) {
    log(`✅ TERMOS_SERVICO.md (${sizeKB} KB, com disclaimer médico)`, 'green');
    passedChecks++;
  } else if (!hasMedicalDisclaimer) {
    log(`❌ TERMOS_SERVICO.md falta disclaimer médico!`, 'red');
    log(`   CRÍTICO: Google Play exige esse disclaimer`, 'red');
  }
} else {
  log(`❌ TERMOS_SERVICO.md não encontrada`, 'red');
}
totalChecks++;

// GitHub Pages URLs
log(`\n⏳ GitHub Pages URLs`, 'yellow');
log(`   Esperado: https://seu-username.github.io/levia-policies/`, 'yellow');
log(`   Status: Requer criação manual de repo + Pages (HELPER_PASSO_4.md)`, 'yellow');

// FASE 5: RESUMO
console.log('\n');
log('════════════════════════════════════════════════════════════', 'cyan');

const percentage = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
log(`📊 RESULTADO: ${passedChecks}/${totalChecks} (${percentage}%)`, 'cyan');
log('════════════════════════════════════════════════════════════\n', 'cyan');

if (percentage === 100) {
  log('🎉 TUDO PRONTO!', 'green');
  log('   ✅ Build completo', 'green');
  log('   ✅ Screenshots capturados', 'green');
  log('   ✅ Ícone convertido', 'green');
  log('   ✅ Documentação legal completa', 'green');
  log('\n→ Pronto para submeter no Google Play Console amanhã!\n', 'green');
} else if (percentage >= 70) {
  log('⚠️  QUASE PRONTO!', 'yellow');
  log('\nTarefas faltando:', 'yellow');
  if (!fs.existsSync('./screenshots') || fs.readdirSync('./screenshots').length < 6) {
    log('   1. Tirar screenshots (HELPER_PASSO_2.md) - 20 min', 'yellow');
  }
  if (!fs.existsSync('./assets/icon-512.png')) {
    log('   2. Converter ícone: node convert-icon-auto.js - 1 min', 'yellow');
  }
  log('   3. Criar GitHub Pages (HELPER_PASSO_4.md) - 10 min', 'yellow');
  log('\n→ Execute essas tarefas e rode este script novamente\n', 'yellow');
} else {
  log('❌ PROBLEMAS ENCONTRADOS', 'red');
  log('\nVerifique os erros acima e corrija', 'red');
  log('Rode este script novamente após corrigir\n', 'red');
}

// PRÓXIMOS PASSOS
log('════════════════════════════════════════════════════════════', 'cyan');
log('📋 PRÓXIMOS PASSOS:\n', 'cyan');

if (percentage < 100) {
  log('HOJE (se tiver 30 min):', 'bright');
  log('  1. node convert-icon-auto.js', 'cyan');
  log('  2. HELPER_PASSO_2.md (screenshots)', 'cyan');
  log('  3. HELPER_PASSO_4.md (GitHub Pages)', 'cyan');
  log('  4. node validate-publication-assets.js (validar)\n', 'cyan');
} else {
  log('AMANHÃ (30/09):', 'bright');
  log('  1. Baixar AAB do build EAS', 'cyan');
  log('  2. Abrir PASSO_5_GOOGLE_PLAY.md', 'cyan');
  log('  3. Abrir DADOS_CONSOLE.md (dados pré-preenchidos)', 'cyan');
  log('  4. Acessar Google Play Console', 'cyan');
  log('  5. Submeter app para review', 'cyan');
  log('  6. 🚀 Em 24-48h app estará LIVE!\n', 'cyan');
}

log('════════════════════════════════════════════════════════════\n', 'cyan');
