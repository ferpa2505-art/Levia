#!/usr/bin/env node

/**
 * VALIDAÇÃO DE ASSETS PARA PUBLICAÇÃO
 * 
 * Este script valida se todos os assets estão prontos para submissão ao Google Play
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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.resolve(filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    log(`✅ ${description}`, 'green');
    log(`   Tamanho: ${(stats.size / 1024).toFixed(2)} KB`, 'cyan');
    return { success: true, size: stats.size };
  } else {
    log(`❌ FALTA: ${description}`, 'red');
    log(`   Esperado em: ${fullPath}`, 'yellow');
    return { success: false, size: 0 };
  }
}

function checkImageDimensions(filePath, expectedWidth, expectedHeight) {
  // Nota: Validação real requer biblioteca de imagem (sharp, jimp, etc)
  // Por enquanto, apenas checa tamanho e nome
  const exists = fs.existsSync(filePath);
  if (!exists) return false;
  
  log(`   ⚠️  Dica: Validar manualmente dimensões com:`, 'yellow');
  log(`       Windows: Properties → Details`, 'cyan');
  log(`       Mac: Get Info → More Info`, 'cyan');
  log(`       Linux: identify (ImageMagick) ou 'file'`, 'cyan');
  
  return true;
}

function main() {
  log('\n════════════════════════════════════════════════════════', 'cyan');
  log('📊 VALIDAÇÃO DE ASSETS PARA PUBLICAÇÃO', 'blue');
  log('════════════════════════════════════════════════════════\n', 'cyan');

  let totalChecks = 0;
  let passedChecks = 0;

  // 1. SCREENSHOTS
  log('📸 VALIDANDO SCREENSHOTS\n', 'blue');
  
  const screenshotPaths = [
    'screenshots/01-home.png',
    'screenshots/02-diabetes-overview.png',
    'screenshots/03-glicemia.png',
    'screenshots/04-medicacoes.png',
    'screenshots/05-refeicoes.png',
    'screenshots/06-notas.png',
    'screenshots/07-adicionar-glicemia.png',
    'screenshots/08-app-icon.png',
  ];

  const screenshotResults = screenshotPaths.map((pathStr, idx) => {
    const result = checkFile(pathStr, `Screenshot ${idx + 1}: ${path.basename(pathStr)}`);
    totalChecks++;
    if (result.success) passedChecks++;
    
    if (result.success) {
      log(`   ℹ️  Validar: Dimensões 1080x1920 (Google Play exige!)`, 'yellow');
      checkImageDimensions(pathStr, 1080, 1920);
    }
    log('');
    
    return result;
  });

  // 2. ÍCONE
  log('🎨 VALIDANDO ÍCONE\n', 'blue');
  
  const iconResult = checkFile('assets/icon-512.png', 'Ícone PNG 512x512');
  totalChecks++;
  if (iconResult.success) passedChecks++;
  
  if (iconResult.success) {
    log(`   ℹ️  Validar: Dimensões 512x512 pixels`, 'yellow');
    checkImageDimensions('assets/icon-512.png', 512, 512);
    
    // Validar tamanho em KB
    if (iconResult.size > 51200) { // 50 KB
      log(`   ⚠️  ATENÇÃO: Ícone > 50 KB (${(iconResult.size / 1024).toFixed(2)} KB)`, 'yellow');
    } else if (iconResult.size < 5120) { // 5 KB
      log(`   ⚠️  ATENÇÃO: Ícone < 5 KB (muito pequeno?)`, 'yellow');
    }
  }
  log('');

  // 3. DOCUMENTOS LEGAIS
  log('📄 VALIDANDO DOCUMENTOS LEGAIS\n', 'blue');
  
  const privacyResult = checkFile('PRIVACIDADE.md', 'PRIVACIDADE.md');
  totalChecks++;
  if (privacyResult.success) passedChecks++;
  log('');
  
  const termsResult = checkFile('TERMOS_SERVICO.md', 'TERMOS_SERVICO.md');
  totalChecks++;
  if (termsResult.success) passedChecks++;
  log('');

  // 4. BUILD (AAB)
  log('📦 VALIDANDO BUILD AAB\n', 'blue');
  
  const aabResult = checkFile('levia-app-v0.1.0.aab', 'AAB file (levia-app-v0.1.0.aab)');
  totalChecks++;
  if (aabResult.success) {
    passedChecks++;
  } else {
    log(`   ℹ️  AAB é gerado pelo EAS. Download aqui:`, 'yellow');
    log(`       https://expo.dev/artifacts/eas/mZDMWKKifACT6FhEKOw6p0GPWLGTtx1Qt72eANmLo4I.aab`, 'cyan');
  }
  log('');

  // 5. CONFIGURAÇÃO
  log('⚙️  VALIDANDO CONFIGURAÇÃO\n', 'blue');
  
  const appJsonResult = checkFile('app.json', 'app.json');
  totalChecks++;
  if (appJsonResult.success) passedChecks++;
  
  if (appJsonResult.success) {
    const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
    const expo = appJson.expo || {};
    
    log(`   Nome: ${expo.name || 'NÃO DEFINIDO'}`, expo.name ? 'green' : 'red');
    log(`   Package: ${expo.android?.package || 'NÃO DEFINIDO'}`, expo.android?.package ? 'green' : 'red');
    log(`   Versão: ${expo.version || 'NÃO DEFINIDO'}`, expo.version ? 'green' : 'red');
  }
  log('');

  // 6. URLS DE POLÍTICAS (Manual - usuário precisa anotar)
  log('🔗 URLS DE POLÍTICAS (Anote estas para o Console)\n', 'blue');
  
  log(`   Você deve ter:`, 'cyan');
  log(`   ✓ URL de PRIVACIDADE (GitHub Pages ou seu servidor)`, 'yellow');
  log(`   ✓ URL de TERMOS (GitHub Pages ou seu servidor)`, 'yellow');
  log('');

  // RESUMO FINAL
  log('════════════════════════════════════════════════════════', 'cyan');
  log('📊 RESUMO\n', 'blue');

  const percentage = Math.round((passedChecks / totalChecks) * 100);
  const statusColor = percentage === 100 ? 'green' : percentage >= 80 ? 'yellow' : 'red';

  log(`Checagem completa: ${passedChecks}/${totalChecks} (${percentage}%)`, statusColor);
  log('');

  if (percentage === 100) {
    log('✅ TUDO PRONTO PARA SUBMISSÃO!', 'green');
    log('Próximo passo: Abrir Google Play Console e submeter (Passo 5)', 'green');
    log('Veja: GUIA_PUBLICACAO_GOOGLE_PLAY.md', 'cyan');
  } else if (percentage >= 80) {
    log('⚠️  QUASE PRONTO!', 'yellow');
    log('Faltam alguns items acima. Complete-os antes de submeter.', 'yellow');
  } else {
    log('❌ ITEMS FALTANDO', 'red');
    log('Complete todos os Passos 2-4 antes de submeter ao Console.', 'red');
  }

  log('\n════════════════════════════════════════════════════════\n', 'cyan');
}

main();
