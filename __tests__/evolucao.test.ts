import { calcularEvolucao, diferenca, DadosEvolucao } from '../src/utils/evolucao';

const HOJE = '2026-11-10';
const vazio = (): DadosEvolucao => ({
  refeicoes: [], aguas: [], pesos: [], exercicios: [], glicemias: [], dosesGlp1: [], medicacoes: [],
  alvoGlicemia: { min: 70, max: 180 },
});
const refeicao = (data: string, kcal: number, proteinaG = 10, id = data + kcal) =>
  ({ id, data, horario: '12:00', nome: 'x', kcal, proteinaG, carboidratoG: 20, gorduraG: 5, fibraG: 3 });

describe('evolução: período e comparação', () => {
  test('sem nenhum registro o período vem vazio e sem médias', () => {
    const e = calcularEvolucao(vazio(), 'semana', HOJE);
    expect(e.vazio).toBe(true);
    expect(e.atual.kcalMediaDia).toBeNull();
    expect(e.atual.glicemia.medicoes).toBe(0);
    expect(e.barras).toHaveLength(7);
    expect(e.de).toBe('2026-11-04');
    expect(e.ate).toBe(HOJE);
  });

  test('média por dia só conta dias com registro e soma as refeições do mesmo dia', () => {
    const d = vazio();
    d.refeicoes = [refeicao('2026-11-10', 500, 30, 'a'), refeicao('2026-11-10', 700, 20, 'b'), refeicao('2026-11-08', 800, 40, 'c')];
    const e = calcularEvolucao(d, 'semana', HOJE);
    expect(e.atual.diasComRefeicao).toBe(2);
    expect(e.atual.refeicoes).toBe(3);
    expect(e.atual.kcalMediaDia).toBe(1000); // (1200 + 800) / 2 dias com registro
    expect(e.atual.proteinaMediaDiaG).toBe(45); // (50 + 40) / 2
    expect(e.vazio).toBe(false);
  });

  test('compara com o período anterior do mesmo tamanho', () => {
    const d = vazio();
    d.refeicoes = [refeicao('2026-11-09', 1800), refeicao('2026-11-02', 2000)];
    const e = calcularEvolucao(d, 'semana', HOJE); // atual: 04–10/11; anterior: 28/10–03/11
    expect(e.atual.kcalMediaDia).toBe(1800);
    expect(e.anterior?.kcalMediaDia).toBe(2000);
    expect(diferenca(e.atual.kcalMediaDia, e.anterior?.kcalMediaDia ?? null)).toBe(-200);
    expect(diferenca(null, 100)).toBeNull();
  });

  test('"dia" compara hoje com ontem e não monta barras', () => {
    const d = vazio();
    d.refeicoes = [refeicao('2026-11-10', 900), refeicao('2026-11-09', 1100)];
    const e = calcularEvolucao(d, 'dia', HOJE);
    expect(e.atual.dias).toBe(1);
    expect(e.atual.kcalMediaDia).toBe(900);
    expect(e.anterior?.kcalMediaDia).toBe(1100);
    expect(e.barras).toHaveLength(0);
  });

  test('"desde o início" começa no primeiro registro, não compara e agrupa por semana ou por mês conforme o tamanho', () => {
    const d = vazio();
    d.refeicoes = [refeicao('2026-08-01', 1500), refeicao('2026-11-10', 1700)];
    const e = calcularEvolucao(d, 'inicio', HOJE);
    expect(e.de).toBe('2026-08-01');
    expect(e.anterior).toBeNull();
    expect(e.atual.diasComRefeicao).toBe(2);
    expect(e.barras).toHaveLength(15); // 102 dias em semanas
    expect(e.barras[0].kcal).toBe(1500);
    expect(e.barras[14].kcal).toBe(1700);

    d.refeicoes = [refeicao('2026-05-01', 1500), refeicao('2026-11-10', 1700)];
    expect(calcularEvolucao(d, 'inicio', HOJE).barras).toHaveLength(7); // 193 dias em meses de 30 dias
  });

  test('registros fora do período, de datas futuras ou em outro dia não entram', () => {
    const d = vazio();
    d.refeicoes = [refeicao('2026-10-01', 3000)];
    d.aguas = [{ id: '1', data: '2026-11-10', horario: '10:00', ml: 500 }, { id: '2', data: '2026-11-10', horario: '15:00', ml: 700 }];
    const e = calcularEvolucao(d, 'semana', HOJE);
    expect(e.atual.refeicoes).toBe(0);
    expect(e.atual.aguaMediaDiaMl).toBe(1200);
  });

  test('peso: variação entre a primeira e a última pesagem do período', () => {
    const d = vazio();
    d.pesos = [
      { id: '1', data: '2026-11-09', pesoKg: 80.4 },
      { id: '2', data: '2026-11-05', pesoKg: 81.5 },
    ];
    const e = calcularEvolucao(d, 'semana', HOJE);
    expect(e.atual.pesoInicialKg).toBe(81.5);
    expect(e.atual.pesoFinalKg).toBe(80.4);
    expect(e.atual.pesoVariacaoKg).toBe(-1.1);
    expect(e.pesos.map((p) => p.data)).toEqual(['2026-11-05', '2026-11-09']);
    // uma pesagem só: sem variação
    d.pesos = [{ id: '1', data: '2026-11-09', pesoKg: 80 }];
    expect(calcularEvolucao(d, 'semana', HOJE).atual.pesoVariacaoKg).toBeNull();
  });

  test('glicemia: converte mmol/L, calcula média, extremos e % dentro do alvo', () => {
    const d = vazio();
    d.glicemias = [
      { id: '1', data: '2026-11-10', horario: '08:00', valor: 100, unidade: 'mg/dL' },
      { id: '2', data: '2026-11-10', horario: '12:00', valor: 200, unidade: 'mg/dL' },
      { id: '3', data: '2026-11-09', horario: '12:00', valor: 6, unidade: 'mmol/L' }, // 108 mg/dL
      { id: '4', data: '2026-11-09', horario: '20:00', valor: 60, unidade: 'mg/dL' },
    ];
    const g = calcularEvolucao(d, 'semana', HOJE).atual.glicemia;
    expect(g.medicoes).toBe(4);
    expect(g.mediaMgDl).toBe(117); // (100 + 200 + 108 + 60) / 4
    expect(g.minimoMgDl).toBe(60);
    expect(g.maximoMgDl).toBe(200);
    expect(g.noAlvoPct).toBe(50); // 100 e 108 dentro de 70–180
  });

  test('conta doses de GLP-1, medicações e exercícios do período', () => {
    const d = vazio();
    d.dosesGlp1 = [
      { id: '1', data: '2026-11-04', horario: '09:00', medicamento: 'Ozempic', dosagemMg: 0.5, local: 'abdômen' },
      { id: '2', data: '2026-10-01', horario: '09:00', medicamento: 'Ozempic', dosagemMg: 0.5, local: 'abdômen' },
    ];
    d.medicacoes = [{ id: 'm', data: '2026-11-10', horario: '07:00', medicamento: 'Metformina', dosagem: '500 mg' }];
    d.exercicios = [{ id: 'e', data: '2026-11-10', horario: '18:00', nome: 'Caminhada', duracaoMin: 30, kcalGasto: 120 }];
    const a = calcularEvolucao(d, 'semana', HOJE).atual;
    expect(a.dosesGlp1).toBe(1);
    expect(a.medicacoesRegistradas).toBe(1);
    expect(a.exercicioMin).toBe(30);
    expect(a.exercicioKcal).toBe(120);
  });

  test('campos opcionais ausentes valem zero e não geram NaN', () => {
    const d = vazio();
    d.refeicoes = [{ id: '1', data: HOJE, horario: '12:00', nome: 'x', kcal: 400, proteinaG: 20 } as any];
    const a = calcularEvolucao(d, 'dia', HOJE).atual;
    expect(a.carboidratoMediaDiaG).toBe(0);
    expect(a.fibraMediaDiaG).toBe(0);
    expect(Number.isNaN(a.kcalMediaDia)).toBe(false);
  });
});
