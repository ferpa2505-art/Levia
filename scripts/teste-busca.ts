// Teste rápido da busca de alimentos: npx tsx --tsconfig tsconfig.json scripts/teste-busca.ts
import { buscarIngredientes, todosIngredientes } from '../src/constants/ingredients';

console.log('total', todosIngredientes.length);
for (const t of ['a', 'c', 'acucar', 'cen', 'batata crua', 'pao de q', 'feij']) {
  console.log(JSON.stringify(t), '->', buscarIngredientes(t, 6).map((i) => `${i.nome} (${i.kcalPor100g})`).join(' | '));
}
