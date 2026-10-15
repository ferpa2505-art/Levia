import { calcularTendencia, preverMeta, diaNumero } from '../src/utils/tendenciaPeso';

const peso = (data: string, pesoKg: number) => ({ id: data, data, pesoKg });

describe('Tendência de peso e previsão da meta', () => {
  test('sem pesagens suficientes não há tendência', () => {
    expect(calcularTendencia([peso('2026-10-01', 90), peso('2026-10-05', 89)])).toBeNull();
    // 3 pesagens, mas em menos de 7 dias
    expect(calcularTendencia([peso('2026-10-01', 90), peso('2026-10-03', 89.8), peso('2026-10-05', 89.5)])).toBeNull();
  });

  test('perda constante de 0,1 kg/dia vira reta exata', () => {
    const pesos = [0, 7, 14, 21].map((d) => peso(`2026-09-${String(1 + d).padStart(2, '0')}`, 90 - 0.1 * d));
    const t = calcularTendencia(pesos)!;
    expect(t.kgPorDia).toBeCloseTo(-0.1, 6);
    // 87,9 kg no dia 22/09; faltam 7,9 kg até 80 → 79 dias
    const p = preverMeta(t, 87.9, 80);
    expect(p.tipo).toBe('data');
    if (p.tipo === 'data') expect(p.dia - diaNumero('2026-09-22')).toBe(79);
  });

  test('peso subindo com meta de perder: sem data', () => {
    const pesos = [peso('2026-09-01', 80), peso('2026-09-08', 80.5), peso('2026-09-15', 81)];
    expect(preverMeta(calcularTendencia(pesos), 81, 70).tipo).toBe('longe');
  });

  test('meta de ganhar peso também funciona', () => {
    const pesos = [peso('2026-09-01', 50), peso('2026-09-08', 50.7), peso('2026-09-15', 51.4)];
    expect(preverMeta(calcularTendencia(pesos), 51.4, 55).tipo).toBe('data');
  });

  test('já na meta e sem meta', () => {
    expect(preverMeta(null, 70.1, 70).tipo).toBe('naMeta');
    expect(preverMeta(null, 70, null).tipo).toBe('semMeta');
  });

  test('pesagens antigas fora da janela de 28 dias são ignoradas', () => {
    const pesos = [
      peso('2026-01-01', 120), // muito antigo: não pode puxar a reta
      peso('2026-09-01', 90),
      peso('2026-09-11', 89),
      peso('2026-09-21', 88),
    ];
    expect(calcularTendencia(pesos)!.kgPorDia).toBeCloseTo(-0.1, 6);
  });

  test('ritmo lentíssimo não vira data absurda', () => {
    const pesos = [peso('2026-09-01', 100), peso('2026-09-15', 99.9), peso('2026-09-29', 99.8)];
    expect(preverMeta(calcularTendencia(pesos), 99.8, 60).tipo).toBe('muitoLonge');
  });
});
