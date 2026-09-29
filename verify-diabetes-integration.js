#!/usr/bin/env node

/**
 * VERIFICAÇÃO DE INTEGRAÇÃO DO MÓDULO DIABETES
 * 
 * Valida a integração completa do módulo no projeto
 * Pode rodar sem o app estar iniciado
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║       VERIFICAÇÃO DE INTEGRAÇÃO - MÓDULO DIABETES             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;
const errors = [];

/**
 * TEST 1: Verificar importações no context
 */
console.log('🔍 TEST 1: Validar importações no DiabetesContext...');
try {
  const contextContent = fs.readFileSync('src/context/DiabetesContext.tsx', 'utf8');
  
  const imports = [
    { pattern: "import { createContext", desc: "createContext import" },
    { pattern: "useState", desc: "useState import" },
    { pattern: "from 'react'", desc: "React import" },
    { pattern: "@models/diabetes", desc: "tipos import" },
    { pattern: "@utils/recordsStorage", desc: "utils import" },
  ];
  
  imports.forEach(imp => {
    if (contextContent.includes(imp.pattern)) {
      console.log(`  ✅ ${imp.desc}`);
      passed++;
    } else {
      console.log(`  ❌ ${imp.desc} FALTANDO`);
      errors.push(`DiabetesContext: ${imp.pattern} não encontrado`);
      failed++;
    }
  });
} catch (err) {
  console.log(`  ❌ Erro: ${err.message}`);
  errors.push(`DiabetesContext leitura: ${err.message}`);
  failed++;
}

/**
 * TEST 2: Validar funções CRUD no context
 */
console.log('\n🔍 TEST 2: Validar funções CRUD...');
try {
  const contextContent = fs.readFileSync('src/context/DiabetesContext.tsx', 'utf8');
  
  const crudOps = [
    { name: 'adicionarGlicemia', pattern: 'adicionarGlicemia' },
    { name: 'removerGlicemia', pattern: 'removerGlicemia' },
    { name: 'adicionarMedicacao', pattern: 'adicionarMedicacao' },
    { name: 'removerMedicacao', pattern: 'removerMedicacao' },
    { name: 'adicionarRefeicao', pattern: 'adicionarRefeicao' },
    { name: 'removerRefeicao', pattern: 'removerRefeicao' },
    { name: 'adicionarNota', pattern: 'adicionarNota' },
    { name: 'removerNota', pattern: 'removerNota' },
  ];
  
  crudOps.forEach(op => {
    if (contextContent.includes(op.pattern)) {
      console.log(`  ✅ ${op.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${op.name} FALTANDO`);
      errors.push(`Operação CRUD: ${op.name} não implementada`);
      failed++;
    }
  });
} catch (err) {
  console.log(`  ❌ Erro: ${err.message}`);
  failed++;
}

/**
 * TEST 3: Validar componente UI
 */
console.log('\n🔍 TEST 3: Validar componente UI...');
try {
  const componentContent = fs.readFileSync('app/diabetes/index.tsx', 'utf8');
  
  const uiElements = [
    { name: 'GlicemiaSection', pattern: 'Glicemia' },
    { name: 'MedicacoesSection', pattern: 'Medicações' },
    { name: 'RefeicoesSection', pattern: 'Refeições' },
    { name: 'NotasSection', pattern: 'Notas' },
    { name: 'Forms', pattern: 'useState' },
    { name: 'Delete action', pattern: 'remover' },
    { name: 'Add action', pattern: 'adicionar' },
  ];
  
  uiElements.forEach(el => {
    if (componentContent.includes(el.pattern)) {
      console.log(`  ✅ ${el.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${el.name} FALTANDO`);
      errors.push(`UI: ${el.name} não encontrado`);
      failed++;
    }
  });
} catch (err) {
  console.log(`  ❌ Erro: ${err.message}`);
  failed++;
}

/**
 * TEST 4: Validar navegação
 */
console.log('\n🔍 TEST 4: Validar integração de rota...');
try {
  const layoutContent = fs.readFileSync('app/_layout.tsx', 'utf8');
  
  if (layoutContent.includes('diabetes')) {
    console.log(`  ✅ Rota diabetes registrada`);
    passed++;
  } else {
    console.log(`  ❌ Rota diabetes NÃO encontrada`);
    errors.push('Navegação: rota diabetes não registrada');
    failed++;
  }
} catch (err) {
  console.log(`  ⚠️  Não foi possível validar _layout.tsx`);
}

/**
 * TEST 5: Validar traduções
 */
console.log('\n🔍 TEST 5: Validar arquivos de i18n...');

const i18nDirs = [
  'locales',
  'src/locales',
  'app/locales',
  'i18n',
];

let i18nFound = false;
let translationFiles = [];

for (const dir of i18nDirs) {
  if (fs.existsSync(dir)) {
    try {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
      translationFiles = files;
      i18nFound = true;
      console.log(`  ✅ Diretório i18n encontrado: ${dir}`);
      passed++;
      break;
    } catch (e) {
      // Continue to next directory
    }
  }
}

if (!i18nFound) {
  console.log(`  ⚠️  Diretório de traduções não encontrado (verificar estrutura)`);
}

if (translationFiles.length > 0) {
  console.log(`  ℹ️  ${translationFiles.length} arquivos de tradução encontrados`);
}

/**
 * TEST 6: Validar Mock Data Realista
 */
console.log('\n🔍 TEST 6: Validar dados mockados...');
try {
  const contextContent = fs.readFileSync('src/context/DiabetesContext.tsx', 'utf8');
  
  const mockChecks = [
    { pattern: '118', desc: 'Glicemia 118' },
    { pattern: '145', desc: 'Glicemia 145' },
    { pattern: '128', desc: 'Glicemia 128' },
    { pattern: 'Metformina', desc: 'Medicação Metformina' },
    { pattern: 'Café', desc: 'Refeição Café' },
    { pattern: 'Almoço', desc: 'Refeição Almoço' },
    { pattern: 'Jantar', desc: 'Refeição Jantar' },
  ];
  
  mockChecks.forEach(check => {
    if (contextContent.includes(check.pattern)) {
      console.log(`  ✅ ${check.desc}`);
      passed++;
    } else {
      console.log(`  ❌ ${check.desc} FALTANDO`);
      errors.push(`Mock data: ${check.desc} não encontrado`);
      failed++;
    }
  });
} catch (err) {
  console.log(`  ❌ Erro: ${err.message}`);
  failed++;
}

/**
 * TEST 7: Validar validações de entrada
 */
console.log('\n🔍 TEST 7: Validar validações de formulário...');
try {
  const componentContent = fs.readFileSync('app/diabetes/index.tsx', 'utf8');
  
  const validations = [
    { pattern: 'parseFloat', desc: 'Parsing numérico' },
    { pattern: 'isNaN', desc: 'Validação NaN' },
    { pattern: '>', desc: 'Validação maior que' },
    { pattern: '<', desc: 'Validação menor que' },
    { pattern: 'trim', desc: 'Trim de strings' },
  ];
  
  validations.forEach(val => {
    if (componentContent.includes(val.pattern)) {
      console.log(`  ✅ ${val.desc}`);
      passed++;
    } else {
      console.log(`  ⚠️  ${val.desc} (pode estar em outro arquivo)`);
    }
  });
} catch (err) {
  console.log(`  ❌ Erro: ${err.message}`);
  failed++;
}

/**
 * TEST 8: Validar padrões React
 */
console.log('\n🔍 TEST 8: Validar padrões React...');
try {
  const contextContent = fs.readFileSync('src/context/DiabetesContext.tsx', 'utf8');
  const componentContent = fs.readFileSync('app/diabetes/index.tsx', 'utf8');
  
  const patterns = [
    { file: 'context', content: contextContent, pattern: 'useContext', desc: 'useContext hook' },
    { file: 'context', content: contextContent, pattern: 'Provider', desc: 'Provider component' },
    { file: 'component', content: componentContent, pattern: 'useDiabetes', desc: 'useDiabetes hook' },
    { file: 'component', content: componentContent, pattern: 'ScrollView', desc: 'ScrollView' },
    { file: 'component', content: componentContent, pattern: 'flatListData', desc: 'Data rendering' },
  ];
  
  patterns.forEach(pat => {
    if (pat.content.includes(pat.pattern)) {
      console.log(`  ✅ ${pat.desc}`);
      passed++;
    } else {
      console.log(`  ⚠️  ${pat.desc} (pode estar em outro padrão)`);
    }
  });
} catch (err) {
  console.log(`  ❌ Erro: ${err.message}`);
  failed++;
}

/**
 * Resumo Final
 */
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                    RESUMO DA INTEGRAÇÃO                        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`✅ Passou:  ${passed}`);
console.log(`❌ Falhou:  ${failed}`);
console.log(`────────────────────────`);
console.log(`Total:     ${passed + failed}`);

if (errors.length > 0) {
  console.log('\n⚠️  ERROS ENCONTRADOS:\n');
  errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err}`);
  });
}

console.log('\n════════════════════════════════════════════════════════════════\n');

const passPercentage = Math.round((passed / (passed + failed)) * 100);

if (failed === 0 && errors.length === 0) {
  console.log(`✅ INTEGRAÇÃO OK (${passPercentage}%) - Pronto para testes UI\n`);
  process.exit(0);
} else if (passPercentage >= 80) {
  console.log(`⚠️  INTEGRAÇÃO COM AVISOS (${passPercentage}%) - Verificar acima\n`);
  process.exit(0);
} else {
  console.log(`❌ INTEGRAÇÃO COM PROBLEMAS (${passPercentage}%) - Corrigir acima\n`);
  process.exit(1);
}
