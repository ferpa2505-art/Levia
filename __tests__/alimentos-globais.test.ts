import {
  buscarAlimentosGlobais,
  buscarAlimentoPorId,
  alimentosGlobais,
  nomeCategoria,
  TOTAL_ALIMENTOS_GLOBAIS,
  CREDITO_FONTES_ALIMENTOS,
} from '../src/constants/alimentosGlobais';

const estendido = require('../src/data/alimentosEstendidos.json');
const pratos = require('../src/data/alimentosPratos.json');

describe('banco estendido (Open Food Facts, ODbL)', () => {
  const itens: any[][] = estendido.itens;

  test('é grande, tem a licença e o crédito declarados', () => {
    expect(itens.length).toBeGreaterThan(20000);
    expect(estendido.licenca).toBe('ODbL-1.0');
    expect(estendido.fonte).toContain('Open Food Facts');
    expect(CREDITO_FONTES_ALIMENTOS).toContain('Open Food Facts');
    expect(CREDITO_FONTES_ALIMENTOS).toContain('ODbL');
  });

  test('todo item tem valores plausíveis e coerentes (nada de kJ gravado como kcal)', () => {
    const ids = new Set<string>();
    for (const [id, cat, kcal, p, c, g, f, porcao, nome, pais] of itens) {
      expect(ids.has(id)).toBe(false);
      ids.add(id);
      expect(id).toMatch(/^O\d{4,14}$/);
      expect(typeof cat).toBe('string');
      expect(nome.length).toBeGreaterThanOrEqual(3);
      expect(nome).not.toContain('�');
      expect(pais).toMatch(/^[A-Z]{2}$/);
      for (const v of [p, c, g]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); }
      expect(p + c + g).toBeLessThanOrEqual(100.6);
      expect(kcal).toBeGreaterThanOrEqual(0);
      expect(kcal).toBeLessThanOrEqual(905);
      expect(f).toBeGreaterThanOrEqual(0);
      const atwater = 4 * p + 4 * c + 9 * g;
      expect(Math.abs(kcal - atwater) / Math.max(kcal, atwater, 30)).toBeLessThanOrEqual(0.26);
      expect(porcao).toBeGreaterThanOrEqual(5);
      expect(porcao).toBeLessThanOrEqual(500);
    }
  });

  test('cobre vários países, com o Brasil bem representado', () => {
    const por: Record<string, number> = {};
    for (const i of itens) por[i[9]] = (por[i[9]] ?? 0) + 1;
    expect(Object.keys(por).length).toBeGreaterThanOrEqual(10);
    expect(por.BR).toBeGreaterThan(2000);
  });
});

describe('pratos prontos extras (estimativas do Levia)', () => {
  test('formato do banco principal, kcal = Atwater, ids únicos com prefixo D', () => {
    const ids = new Set<string>();
    for (const l of pratos.itens as any[][]) {
      expect(l).toHaveLength(13);
      expect(l[0]).toMatch(/^D\d{3}$/);
      expect(ids.has(l[0])).toBe(false);
      ids.add(l[0]);
      expect(Math.abs(l[2] - (4 * l[3] + 4 * l[4] + 9 * l[5]))).toBeLessThanOrEqual(1);
      for (const nome of l.slice(8)) expect(String(nome).trim().length).toBeGreaterThan(2);
    }
    expect(ids.size).toBeGreaterThanOrEqual(60);
  });
});

describe('busca integrada', () => {
  test('o total conta o banco curado + pratos extras', () => {
    expect(TOTAL_ALIMENTOS_GLOBAIS).toBeGreaterThan(4500);
    expect(alimentosGlobais('pt').length).toBe(TOTAL_ALIMENTOS_GLOBAIS);
  });

  test('pratos que faltavam agora aparecem nos 5 idiomas', () => {
    expect(buscarAlimentosGlobais('moqueca', 5, 'pt').some((a) => /moqueca/i.test(a.nome))).toBe(true);
    expect(buscarAlimentosGlobais('brigadeiro', 5, 'es').length).toBeGreaterThan(0);
    expect(buscarAlimentosGlobais('tiramisu', 5, 'it').length).toBeGreaterThan(0);
    expect(buscarAlimentosGlobais('pad thai', 5, 'en').length).toBeGreaterThan(0);
    expect(buscarAlimentosGlobais('croque', 5, 'fr').length).toBeGreaterThan(0);
  });

  test('o banco curado vem antes do estendido no empate (arroz → alimento curado primeiro)', () => {
    const r = buscarAlimentosGlobais('arroz', 3, 'pt') as any[];
    expect(r.length).toBeGreaterThan(0);
    expect(String(r[0].id)).not.toMatch(/^O/);
  });

  test('encontra produtos de marca do estendido e os recupera pelo id', () => {
    const alvo = (estendido.itens as any[][]).find((i) => i[9] === 'BR');
    expect(alvo).toBeTruthy();
    const nome = String(alvo![8]);
    const achados = buscarAlimentosGlobais(nome, 20, 'pt');
    expect(achados.some((a: any) => a.id === alvo![0])).toBe(true);
    const direto = buscarAlimentoPorId(alvo![0] as string, 'pt');
    expect(direto?.nome).toBe(nome);
    expect(direto?.kcalPor100g).toBe(alvo![2]);
  });

  test('a categoria "processados" tem nome nos 5 idiomas', () => {
    for (const i of ['pt', 'en', 'es', 'fr', 'it'] as const) {
      expect(nomeCategoria('processados', i)).not.toBe('processados');
    }
  });

  test('busca nos 50 mil itens continua rápida depois de carregada', () => {
    buscarAlimentosGlobais('leite', 8, 'pt'); // carrega e indexa
    const t = Date.now();
    for (let n = 0; n < 20; n++) buscarAlimentosGlobais(['queijo', 'pão', 'chocolate', 'frango'][n % 4], 8, 'pt');
    expect((Date.now() - t) / 20).toBeLessThan(80);
  });
});
