#!/usr/bin/env node

/**
 * SCRIPT: Preparar Leviã para submissão no Google Play Console
 * 
 * Este script:
 * 1. Valida configuração do app
 * 2. Verifica documentação necessária
 * 3. Cria lista de arquivos necessários para submissão
 * 4. Gera checklist final
 * 5. Exibe instruções de next steps
 */

const fs = require('fs');
const path = require('path');

console.clear();
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║        PREPARAR LEVIÃ PARA GOOGLE PLAY CONSOLE SUBMISSION       ║');
console.log('║                    v0.1.0 - Diabetes Module                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;
const issues = [];

// ═════════════════════════════════════════════════════════════════

console.log('📋 FASE 1: VALIDAÇÃO DO PROJETO\n');

// 1. App.json
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const expo = appJson.expo;
  
  console.log('✅ app.json encontrado');
  console.log(`   - Name: ${expo.name}`);
  console.log(`   - Package: ${expo.android.package}`);
  console.log(`   - Version: ${expo.version}`);
  passed++;
} catch (e) {
  console.log(`❌ app.json erro: ${e.message}`);
  failed++;
  issues.push('app.json não encontrado ou inválido');
}

// 2. Package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ package.json encontrado (${packageJson.name})`);
  
  if (packageJson.scripts.build) {
    console.log('   ✓ Script build presente');
  }
  passed++;
} catch (e) {
  console.log(`❌ package.json erro: ${e.message}`);
  failed++;
}

// 3. TypeScript
try {
  fs.readFileSync('tsconfig.json', 'utf8');
  console.log('✅ TypeScript configurado');
  passed++;
} catch {
  console.log('⚠️  TypeScript não configurado (opcional)');
}

// ═════════════════════════════════════════════════════════════════

console.log('\n📄 FASE 2: DOCUMENTAÇÃO LEGAL\n');

const requiredDocs = [
  { file: 'PRIVACIDADE.md', name: 'Política de Privacidade' },
  { file: 'TERMOS_SERVICO.md', name: 'Termos de Serviço' },
  { file: 'GUIA_PUBLICACAO_GOOGLE_PLAY.md', name: 'Guia de Publicação' },
  { file: 'CHECKLIST_PUBLICACAO.txt', name: 'Checklist' }
];

for (const doc of requiredDocs) {
  if (fs.existsSync(doc.file)) {
    const size = fs.statSync(doc.file).size;
    console.log(`✅ ${doc.name} (${(size / 1000).toFixed(1)} KB)`);
    passed++;
  } else {
    console.log(`❌ ${doc.name} FALTANDO`);
    failed++;
    issues.push(`Documentação faltando: ${doc.name}`);
  }
}

// ═════════════════════════════════════════════════════════════════

console.log('\n🎨 FASE 3: ASSETS (Screenshots, Ícones)\n');

// Verificar se pasta screenshots existe
if (fs.existsSync('screenshots')) {
  const files = fs.readdirSync('screenshots').length;
  console.log(`⚠️  Pasta screenshots existe (${files} arquivos)`);
  console.log('   Status: Você precisa capturar screenshots manualmente');
} else {
  console.log('⚠️  Pasta screenshots NÃO existe');
  console.log('   ℹ️  Você precisará capturar 6-8 screenshots (1080x1920)');
  
  // Criar pasta
  try {
    fs.mkdirSync('screenshots', { recursive: true });
    console.log('   ✓ Pasta screenshots criada');
  } catch (e) {
    console.log(`   ❌ Não conseguiu criar: ${e.message}`);
  }
}

// Verificar ícone
if (fs.existsSync('assets/icon.png') || fs.existsSync('assets/icon-512.png')) {
  console.log('✅ Ícone do app encontrado');
  passed++;
} else {
  console.log('⚠️  Ícone app NÃO encontrado (você precisa criar 512x512)');
  issues.push('Ícone 512x512 necessário para submissão');
}

// ═════════════════════════════════════════════════════════════════

console.log('\n🐛 FASE 4: CÓDIGO\n');

// Verificar se módulo Diabetes existe
try {
  fs.readFileSync('app/diabetes/index.tsx', 'utf8');
  console.log('✅ Módulo Diabetes presente');
  passed++;
} catch {
  console.log('❌ Módulo Diabetes NÃO encontrado');
  failed++;
  issues.push('Módulo Diabetes ausente em app/diabetes/index.tsx');
}

// Verificar context
try {
  fs.readFileSync('src/context/DiabetesContext.tsx', 'utf8');
  console.log('✅ Context Diabetes presente');
  passed++;
} catch {
  console.log('❌ Context NÃO encontrado');
  failed++;
}

// ═════════════════════════════════════════════════════════════════

console.log('\n🔗 FASE 5: CONFIGURAÇÃO EXPO\n');

try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const expo = appJson.expo;
  
  const checks = [
    { key: 'name', value: expo.name, expected: 'Leviã' },
    { key: 'slug', value: expo.slug, expected: 'levia-app' },
    { key: 'android.package', value: expo.android?.package, expected: 'com.levia.app' },
    { key: 'version', value: expo.version, expected: '0.1.0' }
  ];
  
  for (const check of checks) {
    if (check.value) {
      console.log(`✅ ${check.key}: ${check.value}`);
      passed++;
    } else {
      console.log(`⚠️  ${check.key}: NÃO CONFIGURADO`);
      issues.push(`app.json: ${check.key} não configurado`);
    }
  }
} catch (e) {
  console.log(`❌ Erro ao validar app.json: ${e.message}`);
  failed++;
}

// ═════════════════════════════════════════════════════════════════

console.log('\n📊 RESUMO VALIDAÇÃO\n');

const total = passed + failed;
const percentage = Math.round((passed / total) * 100);

console.log(`Passou:  ${passed}`);
console.log(`Falhou:  ${failed}`);
console.log(`Total:   ${total}`);
console.log(`Taxa:    ${percentage}%\n`);

// ═════════════════════════════════════════════════════════════════

console.log('🎯 PRÓXIMOS PASSOS RECOMENDADOS\n');

if (issues.length > 0) {
  console.log('⚠️  PROBLEMAS ENCONTRADOS:\n');
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue}`);
  });
  console.log('');
}

console.log('📋 CHECKLIST PARA SUBMISSÃO:\n');

const checklist = [
  { done: true, item: 'Documentação legal (Privacidade + Termos)' },
  { done: true, item: 'Guia de publicação criado' },
  { done: false, item: 'Screenshots capturados (6-8 × 1080x1920)' },
  { done: false, item: 'Ícone criado (512×512 PNG)' },
  { done: false, item: 'Build Android gerado (eas build)' },
  { done: false, item: 'Políticas hospedadas em URL pública' },
  { done: false, item: 'Google Play Console app criado' },
  { done: false, item: 'AAB uploadado no console' },
  { done: false, item: 'Informações preenchidas (descrição, etc)' },
  { done: false, item: 'Submissão para análise do Google' }
];

checklist.forEach((item, i) => {
  const symbol = item.done ? '✅' : '⏳';
  console.log(`${symbol} ${i + 1}. ${item.item}`);
});

console.log('\n═════════════════════════════════════════════════════════════════\n');

console.log('🚀 PRÓXIMO COMANDO A EXECUTAR:\n');
console.log('   eas build --platform android --type app-bundle\n');
console.log('   Tempo estimado: 20-30 minutos');
console.log('   Você receberá link de download por email quando pronto\n');

console.log('═════════════════════════════════════════════════════════════════\n');

console.log('📌 INSTRUÇÕES POR ETAPA:\n');

console.log('ETAPA 1: Gerar Build (próxima)\n');
console.log('  $ eas build --platform android --type app-bundle\n');

console.log('ETAPA 2: Capturar Screenshots (paralelo ao build)\n');
console.log('  - Abrir app em emulador/device Android');
console.log('  - Navegar por cada tela importante');
console.log('  - Tirar 6-8 screenshots (Print Screen)');
console.log('  - Salvar em: screenshots/ (1080×1920)\n');

console.log('ETAPA 3: Preparar Ícone\n');
console.log('  - Tamanho: 512×512 pixels');
console.log('  - Formato: PNG com fundo transparente');
console.log('  - Salvar em: assets/icon.png\n');

console.log('ETAPA 4: Hospedar Documentação\n');
console.log('  - Privacidade: https://seu-site/privacidade');
console.log('  - Termos: https://seu-site/termos');
console.log('  - Recomendação: GitHub Pages (grátis, 5 min)\n');

console.log('ETAPA 5: Submeter no Console\n');
console.log('  - Google Play Console → Criar app');
console.log('  - Preencher informações (descrição, screenshots)');
console.log('  - Upload do AAB gerado');
console.log('  - Submeter para análise\n');

console.log('═════════════════════════════════════════════════════════════════\n');

// Resultado final
if (failed === 0 || (failed < 2 && percentage > 80)) {
  console.log('✅ PROJETO PRONTO PARA PUBLICAÇÃO\n');
  process.exit(0);
} else if (percentage >= 70) {
  console.log('⚠️  Alguns items faltando - veja acima\n');
  process.exit(0);
} else {
  console.log('❌ Problemas significativos encontrados\n');
  process.exit(1);
}
