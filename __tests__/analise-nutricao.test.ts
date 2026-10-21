import { montarSerie, calcularInfluencias, correlacao, inicioDoGrupo, agrupamentoSugerido } from '@utils/analiseNutricao';
import type { Refeicao } from '@models/records';

const ref = (data: string, kcal: number, tipo: Refeicao['tipo'] = 'almoco', carb = 0): Refeicao => ({
  id: `${data}-${tipo}-${kcal}`,
  data,
  horario: '12:00',
  nome: 'x',
  kcal,
  proteinaG: 0,
  carboidratoG: carb,
  tipo,
});

describe('analiseNutricao', () => {
  it('semana começa na segunda e mês no dia 1', () => {
    expect(inicioDoGrupo('2026-10-21', 'semana')).toBe('2026-10-19'); // quarta → segunda
    expect(inicioDoGrupo('2026-10-19', 'semana')).toBe('2026-10-19');
    expect(inicioDoGrupo('2026-10-25', 'semana')).toBe('2026-10-19'); // domingo
    expect(inicioDoGrupo('2026-10-21', 'mes')).toBe('2026-10-01');
    expect(agrupamentoSugerido(7)).toBe('dia');
    expect(agrupamentoSugerido(90)).toBe('semana');
    expect(agrupamentoSugerido(365)).toBe('mes');
  });

  it('soma refeições do dia, filtra por tipo e tira média só dos dias com registro', () => {
    const base = { aguas: [], pesos: [], glicemias: [], inicio: '2026-10-19', fim: '2026-10-25' };
    const refeicoes = [ref('2026-10-19', 500), ref('2026-10-19', 300, 'cafe'), ref('2026-10-21', 1000)];
    const porDia = montarSerie({ ...base, refeicoes, agrupamento: 'dia', tipos: null });
    expect(porDia).toHaveLength(7);
    expect(porDia[0].valores.kcal).toBe(800);
    expect(porDia[1].valores.kcal).toBeNull();
    const semana = montarSerie({ ...base, refeicoes, agrupamento: 'semana', tipos: null });
    expect(semana).toHaveLength(1);
    expect(semana[0].valores.kcal).toBe(900); // (800 + 1000) / 2 dias com registro
    const soCafe = montarSerie({ ...base, refeicoes, agrupamento: 'semana', tipos: ['cafe'] });
    expect(soCafe[0].valores.kcal).toBe(300);
  });

  it('peso é a última pesagem do grupo e glicemia é convertida para mg/dL', () => {
    const s = montarSerie({
      refeicoes: [],
      aguas: [{ id: 'a', data: '2026-10-19', horario: '10:00', ml: 500 }],
      pesos: [
        { id: 'p1', data: '2026-10-19', pesoKg: 80 },
        { id: 'p2', data: '2026-10-22', pesoKg: 79.5 },
      ],
      glicemias: [
        { id: 'g1', data: '2026-10-20', horario: '08:00', valor: 100, unidade: 'mg/dL' },
        { id: 'g2', data: '2026-10-20', horario: '12:00', valor: 6, unidade: 'mmol/L' },
      ],
      inicio: '2026-10-19',
      fim: '2026-10-25',
      agrupamento: 'semana',
      tipos: null,
    });
    expect(s[0].pesoKg).toBe(79.5);
    expect(s[0].glicemiaMgDl).toBe(104); // (100 + 108) / 2
    expect(s[0].valores.aguaMl).toBe(500);
  });

  it('correlação exige 4 pares e detecta relação positiva', () => {
    expect(correlacao([[1, 1], [2, 2], [3, 3]])).toBeNull();
    expect(correlacao([[1, 2], [2, 4], [3, 6], [4, 8], [null, 1]])).toEqual({ r: 1, n: 4 });
    expect(correlacao([[1, 5], [2, 5], [3, 5], [4, 5]])).toBeNull(); // sem variação
  });

  it('relaciona carboidrato com glicemia do mesmo dia', () => {
    const dias = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'];
    const s = montarSerie({
      refeicoes: dias.map((d, i) => ref(d, 1500, 'almoco', 100 + i * 50)),
      aguas: [],
      pesos: [],
      glicemias: dias.map((d, i) => ({ id: d, data: d, horario: '14:00', valor: 110 + i * 20, unidade: 'mg/dL' as const })),
      inicio: dias[0],
      fim: dias[4],
      agrupamento: 'dia',
      tipos: null,
    });
    const [carb] = calcularInfluencias(s, ['carboidratoG']);
    expect(carb.glicemia?.r).toBe(1);
    expect(carb.peso).toBeNull();
  });
});
