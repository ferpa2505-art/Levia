jest.mock('@/i18n', () => ({ obterIdiomaAtual: () => 'pt-BR' }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'x' }));
jest.mock('expo-image-manipulator', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));
import { ligarAoBanco } from '../src/utils/iaPrato';

const p100 = { kcal: 300, proteina: 9, carboidrato: 27, gordura: 18, fibra: 1 };
const ligar = (nome: string, nomeIngles = '') =>
  ligarAoBanco({ nome, nomeIngles, unidades: 1, gramas: 100, confianca: 0.9, por100g: p100 }, 'pt');

describe('Ligação do nome dado pela IA ao banco de alimentos', () => {
  test.each([
    ['Coxinha de frango frita', 'Coxinha de frango frita'],
    ['Batata cozida', 'Batata inglesa cozida'],
    ['Purê de batata', 'Purê de batata'],
    ['Arroz branco cozido', 'Arroz branco cozido'],
    ['Peito de frango grelhado', 'Peito de frango grelhado'],
  ])('%s → %s (do banco)', (nome, esperado) => {
    const r = ligar(nome);
    expect(r.origem).toBe('banco');
    expect(r.alimento.nome).toBe(esperado);
  });

  test('não confunde alimento simples com prato montado', () => {
    expect(ligar('Batata cozida').alimento.nome).not.toMatch(/ com /);
  });

  test('achado pelo nome em inglês volta com o nome em português', () => {
    const r = ligar('Cogumelo champignon refogado', 'Sauteed button mushrooms');
    expect(r.origem).toBe('banco');
    expect(r.alimento.nome).toMatch(/champignon/i);
  });

  test('fora do banco: usa a estimativa da IA, com os 5 nutrientes', () => {
    const r = ligar('Enroladinho de salsicha frito', 'Fried sausage roll');
    expect(r.origem).toBe('ia');
    expect(r.alimento).toMatchObject({ kcalPor100g: 300, proteinaGPor100g: 9, carboidratoGPor100g: 27, gorduraGPor100g: 18, fibraGPor100g: 1 });
  });
});
