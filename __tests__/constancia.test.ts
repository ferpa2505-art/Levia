import { diasSeguidos, partesDosMacros } from '../src/utils/constancia';

describe('constância', () => {
  test('conta dias seguidos até hoje', () => {
    expect(diasSeguidos(['2026-11-08', '2026-11-09', '2026-11-10'], '2026-11-10')).toBe(3);
  });
  test('se hoje ainda não tem refeição, a contagem segue de ontem', () => {
    expect(diasSeguidos(['2026-11-08', '2026-11-09'], '2026-11-10')).toBe(2);
  });
  test('um dia sem registro quebra a sequência', () => {
    expect(diasSeguidos(['2026-11-05', '2026-11-06', '2026-11-09', '2026-11-10'], '2026-11-10')).toBe(2);
  });
  test('sem registro de hoje nem de ontem, zero', () => {
    expect(diasSeguidos(['2026-11-05'], '2026-11-10')).toBe(0);
    expect(diasSeguidos([], '2026-11-10')).toBe(0);
  });
  test('vários registros no mesmo dia contam como um dia', () => {
    expect(diasSeguidos(['2026-11-10', '2026-11-10', '2026-11-09'], '2026-11-10')).toBe(2);
  });
  test('atravessa a virada de mês', () => {
    expect(diasSeguidos(['2026-10-30', '2026-10-31', '2026-11-01'], '2026-11-01')).toBe(3);
  });
});

describe('partes dos macros', () => {
  test('divide as calorias de proteína, carboidrato e gordura', () => {
    // 100 g P = 400, 200 g C = 800, 100 g G = 900 → total 2100
    expect(partesDosMacros(100, 200, 100)).toEqual({ proteina: 19, carboidrato: 38, gordura: 43 });
  });
  test('sem macros devolve zeros', () => {
    expect(partesDosMacros(0, 0, 0)).toEqual({ proteina: 0, carboidrato: 0, gordura: 0 });
  });
});
