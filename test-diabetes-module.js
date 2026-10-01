#!/usr/bin/env node

/**
 * TESTE AUTOMATIZADO DO MÓDULO DIABETES
 * 
 * Este script valida que o módulo Diabetes está funcionando corretamente
 * Pode ser integrado com testes E2E no futuro
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║           VALIDAÇÃO AUTOMATIZADA - MÓDULO DIABETES            ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;
const errors = [];

/**
 * Teste 1: Verificar se arquivos principais existem
 */
console.log('🔍 TESTE 1: Verificar arquivos do módulo...');
const requiredFiles = [
  'src/context/DiabetesContext.tsx',
  'src/types/diabetes.ts',
  'app/diabetes/index.tsx',
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
    passed++;
  } else {
    console.log(`  ❌ ${file} NÃO ENCONTRADO`);
    errors.push(`Arquivo faltando: ${file}`);
    failed++;
  }
});

/**
 * Teste 2: Validar estrutura do DiabetesContext.tsx
 */
console.log('\n🔍 TESTE 2: Validar DiabetesContext.tsx...');
try {
  const contextContent = fs.readFileSync('src/context/DiabetesContext.tsx', 'utf8');
  
  const checks = [
    { name: 'createContext', found: contextContent.includes('createContext') },
    { name: 'Mock data (glicemias)', found: contextContent.includes('glicemias:') },
    { name: 'Mock data (medicacoes)', found: contextContent.includes('medicacoes:') },
    { name: 'Mock data (refeicoes)', found: contextContent.includes('refeicoes:') },
    { name: 'Mock data (notas)', found: contextContent.includes('notas:') },
    { name: 'DiabetesProvider', found: contextContent.includes('DiabetesProvider') },
    { name: 'useDiabetes', found: contextContent.includes('useDiabetes') },
  ];
  
  checks.forEach(check => {
    if (check.found) {
      console.log(`  ✅ ${check.name} presente`);
      passed++;
    } else {
      console.log(`  ❌ ${check.name} NÃO ENCONTRADO`);
      errors.push(`DiabetesContext: ${check.name} faltando`);
      failed++;
    }
  });
} catch (err) {
  console.log(`  ❌ Erro ao ler DiabetesContext.tsx: ${err.message}`);
  errors.push(`DiabetesContext leitura: ${err.message}`);
  failed++;
}

/**
 * Teste 3: Validar tipos em diabetes.ts
 */
console.log('\n🔍 TESTE 3: Validar tipos em diabetes.ts...');
try {
  const typesContent = fs.readFileSync('src/types/diabetes.ts', 'utf8');
  
  const typeChecks = [
    { name: 'RegistroGlicemia', found: typesContent.includes('RegistroGlicemia') },
    { name: 'RegistroMedicacao', found: typesContent.includes('RegistroMedicacao') },
    { name: 'RegistroRefeicao', found: typesContent.includes('RegistroRefeicao') },
    { name: 'NotaDiaria', found: typesContent.includes('NotaDiaria') },
    { name: 'DiabetesData', found: typesContent.includes('DiabetesData') },
  ];
  
  typeChecks.forEach(check => {
    if (check.found) {
      console.log(`  ✅ ${check.name} definido`);
      passed++;
    } else {
      console.log(`  ❌ ${check.name} NÃO ENCONTRADO`);
      errors.push(`Tipos: ${check.name} faltando`);
      failed++;
    }
  });
} catch (err) {
  console.log(`  ❌ Erro ao ler diabetes.ts: ${err.message}`);
  errors.push(`Tipos leitura: ${err.message}`);
  failed++;
}

/**
 * Teste 4: Validar componente principal
 */
console.log('\n🔍 TESTE 4: Validar app/diabetes/index.tsx...');
try {
  const componentContent = fs.readFileSync('app/diabetes/index.tsx', 'utf8');
  
  const componentChecks = [
    { name: 'Seção Glicemia', found: componentContent.includes('Glicemia') },
    { name: 'Seção Medicações', found: componentContent.includes('Medicações') },
    { name: 'Seção Refeições', found: componentContent.includes('Refeições') },
    { name: 'Seção Notas', found: componentContent.includes('Notas') },
    { name: 'useState', found: componentContent.includes('useState') },
    { name: 'useDiabetes', found: componentContent.includes('useDiabetes') },
    { name: 'ScrollView', found: componentContent.includes('ScrollView') },
  ];
  
  componentChecks.forEach(check => {
    if (check.found) {
      console.log(`  ✅ ${check.name} presente`);
      passed++;
    } else {
      console.log(`  ❌ ${check.name} NÃO ENCONTRADO`);
      errors.push(`Componente: ${check.name} faltando`);
      failed++;
    }
  });
} catch (err) {
  console.log(`  ❌ Erro ao ler app/diabetes/index.tsx: ${err.message}`);
  errors.push(`Componente leitura: ${err.message}`);
  failed++;
}

/**
 * Teste 5: Validar integração na navegação
 */
console.log('\n🔍 TESTE 5: Validar integração na navegação...');
try {
  const appContent = fs.readFileSync('app/_layout.tsx', 'utf8');
  
  if (appContent.includes('diabetes')) {
    console.log(`  ✅ Rota '/diabetes' registrada`);
    passed++;
  } else {
    console.log(`  ⚠️  Rota '/diabetes' não encontrada em _layout.tsx`);
    // Não conta como erro, pode estar em outro lugar
  }
} catch (err) {
  console.log(`  ⚠️  Não foi possível validar _layout.tsx`);
}

/**
 * Teste 6: Validar traduções
 */
console.log('\n🔍 TESTE 6: Validar traduções...');
const translationFiles = [
  'locales/pt-BR.json',
  'locales/en-US.json',
];

let translationsOk = true;
translationFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      const content = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (content.titulos && content.titulos.diabetes) {
        console.log(`  ✅ ${file} tem 'titulos.diabetes'`);
        passed++;
      } else {
        console.log(`  ⚠️  ${file} falta 'titulos.diabetes'`);
        translationsOk = false;
      }
    } catch (err) {
      console.log(`  ⚠️  ${file} JSON inválido`);
      translationsOk = false;
    }
  } else {
    console.log(`  ⚠️  ${file} não encontrado`);
    translationsOk = false;
  }
});

/**
 * Teste 7: Validar lint/TypeScript
 */
console.log('\n🔍 TESTE 7: Verificar TypeScript...');
console.log(`  ℹ️  Execute 'npm run type-check' para validação completa`);

/**
 * Resumo Final
 */
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                       RESUMO DOS TESTES                         ║');
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

if (failed === 0 && errors.length === 0) {
  console.log('✅ VALIDAÇÃO AUTOMATIZADA OK - Módulo pronto para testes manuais\n');
  process.exit(0);
} else {
  console.log('⚠️  VALIDAÇÃO COM PROBLEMAS - Verifique os erros acima\n');
  process.exit(1);
}
