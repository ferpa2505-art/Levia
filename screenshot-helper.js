#!/usr/bin/env node

/**
 * SCREENSHOT HELPER - GUIA INTERATIVO
 * 
 * Este script ajuda você a capturar screenshots de forma organizada
 * Vai te guiar passo a passo através de cada tela
 * 
 * Uso: node screenshot-helper.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const screenshotsDir = './screenshots';
const screenshotChecklist = [
  { id: 1, name: 'home', title: 'Home Screen', description: 'Tela inicial do app' },
  { id: 2, name: 'diabetes-overview', title: 'Diabetes Overview', description: 'Visão geral da aba Diabetes' },
  { id: 3, name: 'glicemia', title: 'Glicemia', description: 'Seção de glicemia' },
  { id: 4, name: 'medicacoes', title: 'Medicações', description: 'Seção de medicações' },
  { id: 5, name: 'refeicoes', title: 'Refeições', description: 'Seção de refeições' },
  { id: 6, name: 'notas', title: 'Notas', description: 'Seção de notas' },
  { id: 7, name: 'adicionar', title: 'Modal Adicionar', description: 'Modal quando clica em +' },
  { id: 8, name: 'app-icon', title: 'Ícone do App', description: 'Ícone na home do Android' },
];

async function main() {
  console.clear();
  
  log('╔═══════════════════════════════════════════════════════════════════════════════╗', 'magenta');
  log('║                                                                               ║', 'magenta');
  log('║              📸 SCREENSHOT HELPER - GUIA INTERATIVO PASSO A PASSO            ║', 'magenta');
  log('║                                                                               ║', 'magenta');
  log('╚═══════════════════════════════════════════════════════════════════════════════╝', 'magenta');
  log('', 'reset');

  log('⚙️  PREPARANDO...', 'cyan');
  log('', 'reset');

  // Criar pasta se não existir
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    log(`✅ Pasta 'screenshots/' criada`, 'green');
  } else {
    log(`✅ Pasta 'screenshots/' já existe`, 'green');
  }

  // Contar prints existentes
  const existingFiles = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
  log(`📸 Screenshots já capturados: ${existingFiles.length}/8`, 'blue');
  
  if (existingFiles.length > 0) {
    log('   Encontrados:', 'cyan');
    existingFiles.forEach(f => log(`   - ${f}`, 'cyan'));
  }

  log('', 'reset');
  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  log('📋 CHECKLIST - O QUE VOCÊ PRECISA CAPTURAR', 'cyan');
  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  log('', 'reset');

  for (const screen of screenshotChecklist) {
    const filename = `${String(screen.id).padStart(2, '0')}-${screen.name}.png`;
    const filepath = path.join(screenshotsDir, filename);
    const exists = fs.existsSync(filepath);

    const status = exists ? '✅' : '⏳';
    const name = `${String(screen.id).padStart(2, '0')}-${screen.name}`;
    
    log(`${status} ${name.padEnd(25)} | ${screen.title.padEnd(20)} | ${screen.description}`, 
        exists ? 'green' : 'yellow');
  }

  log('', 'reset');
  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  log('🎬 INSTRUÇÕES PASSO A PASSO', 'cyan');
  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  log('', 'reset');

  log('PASSO 1: Abrir emulador/device Android', 'bright');
  log('  • Se tiver Android Studio: AVD Manager → Play', 'cyan');
  log('  • Se tiver device: USB debugging ON + conectado', 'cyan');
  log('  • Se usar Appetize: upload APK lá', 'cyan');
  log('', 'reset');

  log('PASSO 2: Rodar o app', 'bright');
  log('  $ npm start', 'cyan');
  log('  Escolha: a (para Android)', 'cyan');
  log('', 'reset');

  log('PASSO 3: Tirar screenshots conforme checklist', 'bright');
  log('  Para CADA tela:', 'cyan');
  log('  1. Navegue para a tela', 'cyan');
  log('  2. Tire o screenshot:', 'cyan');
  log('     • Emulador: Ctrl + S', 'magenta');
  log('     • Device: Power + Volume Down', 'magenta');
  log('  3. Mova para pasta screenshots/', 'cyan');
  log('  4. Renomeie com nome do checklist acima', 'cyan');
  log('', 'reset');

  log('PASSO 4: Validar após terminar', 'bright');
  log('  $ node validate-publication-assets.js', 'cyan');
  log('  Resultado esperado: 100% ✅', 'magenta');
  log('', 'reset');

  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  log('⏱️  TEMPO ESTIMADO', 'cyan');
  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  log('', 'reset');

  log('Setup (abrir emulador): 3 minutos', 'cyan');
  log('Navegar + tirar 8 prints: 15 minutos', 'cyan');
  log('Mover/renomear: 2 minutos', 'cyan');
  log('─────────────────────────', 'cyan');
  log('TOTAL: ~20 minutos', 'magenta');
  log('', 'reset');

  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  log('💡 DICAS IMPORTANTES', 'cyan');
  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  log('', 'reset');

  log('✅ Não mostrar barra de status/notificações no screenshot', 'green');
  log('✅ Screenshot deve mostrar apenas a tela do app', 'green');
  log('✅ Todos com dimensão 1080x1920 (automático no Android)', 'green');
  log('✅ Formato PNG ou JPG (PNG preferido)', 'green');
  log('✅ Nomes EXATOS do checklist acima (importante para Console)', 'green');
  log('', 'reset');

  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  log('🚀 PRONTO?', 'cyan');
  log('═══════════════════════════════════════════════════════════════════════════════', 'cyan');
  log('', 'reset');

  log('Próximas ações:', 'bright');
  log('1. Abra emulador/device', 'blue');
  log('2. Execute: npm start', 'blue');
  log('3. Siga o checklist acima', 'blue');
  log('4. Re-execute este script: node screenshot-helper.js', 'blue');
  log('5. Quando ver ✅ em todos: execute node validate-publication-assets.js', 'blue');
  log('', 'reset');

  log('📍 Caminho dos screenshots:', 'cyan');
  log(`   ${path.resolve(screenshotsDir)}`, 'cyan');
  log('', 'reset');

  log('╔═══════════════════════════════════════════════════════════════════════════════╗', 'magenta');
  log('║                           Bora capturar! 📸                                   ║', 'magenta');
  log('╚═══════════════════════════════════════════════════════════════════════════════╝', 'magenta');
  log('', 'reset');
}

main().catch(err => {
  log(`❌ Erro: ${err.message}`, 'red');
  process.exit(1);
});
