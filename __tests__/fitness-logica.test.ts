import {
  criarPlanoInicial,
  estimativa1RM,
  indicePlano,
  melhor1RMAnterior,
  metaDoExercicio,
  minutosPorDia,
  trocarDias,
  ultimasSeriesDoExercicio,
  volumePorGrupo,
} from '../src/utils/fitnessLogica';
import type { ExercicioNaRotina, Sessao, SerieRealizada } from '../src/types/fitness';

const plano = (over: Partial<ExercicioNaRotina> = {}): ExercicioNaRotina => ({
  exercicioId: 'supino-reto-barra',
  series: 3,
  repMin: 8,
  repMax: 12,
  descansoSeg: 90,
  progressao: 'dupla',
  ...over,
});

const serie = (reps: number, carga: number, feita = true, tipo: 'trabalho' | 'aquecimento' = 'trabalho'): SerieRealizada => ({
  exercicioId: 'supino-reto-barra',
  numero: 1,
  tipo,
  repeticoes: reps,
  cargaKg: carga,
  feita,
});

describe('1RM estimado (Epley)', () => {
  it('estima a partir de carga e repetições', () => {
    expect(estimativa1RM(100, 5)).toBe(116.7);
  });
  it('não estima acima de 12 repetições nem sem carga', () => {
    expect(estimativa1RM(100, 13)).toBeUndefined();
    expect(estimativa1RM(0, 5)).toBeUndefined();
  });
});

describe('progressão', () => {
  it('primeira vez não tem carga sugerida', () => {
    const meta = metaDoExercicio(plano(), 'carga', undefined, 2.5);
    expect(meta.motivo).toBe('primeira');
    expect(meta.cargaKg).toBeUndefined();
    expect(meta.repsAlvo).toBe(8);
  });

  it('dupla progressão: sobe uma repetição enquanto não bate o topo', () => {
    const meta = metaDoExercicio(plano(), 'carga', [serie(8, 60), serie(8, 60), serie(8, 60)], 2.5);
    expect(meta.motivo).toBe('repsSobem');
    expect(meta.cargaKg).toBe(60);
    expect(meta.repsAlvo).toBe(9);
  });

  it('dupla progressão: ao bater o topo, sobe a carga e volta ao mínimo', () => {
    const meta = metaDoExercicio(plano(), 'carga', [serie(12, 60), serie(12, 60), serie(12, 60)], 2.5);
    expect(meta.motivo).toBe('reinicia');
    expect(meta.cargaKg).toBe(62.5);
    expect(meta.repsAlvo).toBe(8);
  });

  it('linear: soma o incremento quando completa as séries no mínimo', () => {
    const meta = metaDoExercicio(plano({ progressao: 'linear', repMin: 5, repMax: 5, series: 5 }), 'carga',
      [serie(5, 100), serie(5, 100), serie(5, 100), serie(5, 100), serie(5, 100)], 2.5);
    expect(meta.motivo).toBe('sobe');
    expect(meta.cargaKg).toBe(102.5);
  });

  it('linear: séries incompletas mantêm a carga', () => {
    const meta = metaDoExercicio(plano({ progressao: 'linear', repMin: 5, repMax: 5, series: 5 }), 'carga',
      [serie(5, 100), serie(4, 100)], 2.5);
    expect(meta.motivo).toBe('mantem');
    expect(meta.cargaKg).toBe(100);
  });

  it('sem progressão repete o último treino', () => {
    const meta = metaDoExercicio(plano({ progressao: 'nenhuma' }), 'carga', [serie(10, 40)], 2.5);
    expect(meta.motivo).toBe('semProgressao');
    expect(meta.cargaKg).toBe(40);
  });

  it('exercício de peso corporal progride em repetições', () => {
    const meta = metaDoExercicio(plano({ repMin: 6, repMax: 12 }), 'corpo', [serie(8, 0), serie(8, 0), serie(8, 0)], 2.5);
    expect(meta.motivo).toBe('corpo');
    expect(meta.repsAlvo).toBe(9);
  });

  it('séries de aquecimento não entram na progressão', () => {
    const ultimas = ultimasSeriesDoExercicio([
      sessao('a', '2026-11-01', [serie(5, 40, true, 'aquecimento'), serie(8, 60)]),
    ], 'supino-reto-barra');
    expect(ultimas?.length).toBe(1);
    expect(ultimas?.[0].cargaKg).toBe(60);
  });
});

function sessao(id: string, data: string, series: SerieRealizada[]): Sessao {
  return {
    id,
    data,
    nome: 'Teste',
    inicio: `${data}T10:00:00.000Z`,
    fim: `${data}T11:00:00.000Z`,
    series,
  };
}

describe('recordes e histórico', () => {
  it('melhor 1RM anterior ignora a sessão atual', () => {
    const s1 = sessao('s1', '2026-11-01', [serie(5, 100)]);
    const s2 = sessao('s2', '2026-11-08', [serie(5, 120)]);
    expect(melhor1RMAnterior([s1, s2], 'supino-reto-barra', 's2')).toBe(estimativa1RM(100, 5));
  });

  it('volume por grupo soma carga × reps só de séries de trabalho feitas', () => {
    const s = sessao('s1', '2026-11-08', [serie(10, 50), serie(10, 50, false), serie(10, 20, true, 'aquecimento')]);
    const volume = volumePorGrupo([s], () => 'peito', undefined);
    expect(volume.peito).toBe(500);
  });

  it('minutos por dia somam as sessões do mesmo dia', () => {
    const s1 = sessao('s1', '2026-11-08', []);
    const s2 = sessao('s2', '2026-11-08', []);
    expect(minutosPorDia([s1, s2])['2026-11-08']).toBe(120);
  });
});

describe('plano semanal', () => {
  it('índice começa na segunda-feira', () => {
    expect(indicePlano(new Date(2024, 0, 1))).toBe(0); // segunda
    expect(indicePlano(new Date(2024, 0, 7))).toBe(6); // domingo
  });

  it('troca dois dias sem mexer nos outros', () => {
    const p = trocarDias({ semana: ['a', null, 'b', null, null, null, null] }, 0, 2);
    expect(p.semana).toEqual(['b', null, 'a', null, null, null, null]);
  });

  it('planos iniciais preenchem a semana com rotinas existentes', () => {
    for (const id of ['ppl', 'upperLower', 'fullBody', 'cincoPorCinco'] as const) {
      const { rotinas, plano: p } = criarPlanoInicial(id, '2026-11-11T00:00:00.000Z');
      const ids = rotinas.map((r) => r.id);
      for (const slot of p.semana) {
        if (slot) expect(ids).toContain(slot);
      }
      expect(rotinas.length).toBeGreaterThan(0);
    }
  });
});

import { inicioDaSemanaISO, seriesPorGrupo } from '../src/utils/fitnessLogica';

describe('semana', () => {
  it('início da semana segunda ou domingo', () => {
    const quarta = new Date(2026, 10, 11); // quarta-feira
    expect(inicioDaSemanaISO(quarta, 'seg')).toBe('2026-11-09');
    expect(inicioDaSemanaISO(quarta, 'dom')).toBe('2026-11-08');
  });

  it('conta séries de trabalho feitas por grupo desde o início da semana', () => {
    const s = sessao('s1', '2026-11-10', [serie(10, 50), serie(10, 50), serie(10, 50, false)]);
    const antiga = sessao('s0', '2026-11-02', [serie(10, 50)]);
    const cont = seriesPorGrupo([s, antiga], () => 'peito', '2026-11-09');
    expect(cont.peito).toBe(2);
  });
});

import { kcalDaSessao } from '../src/utils/fitnessLogica';

describe('gasto estimado do treino', () => {
  it('usa MET 5 × peso × horas', () => {
    const s = { ...sessao('k', '2026-11-10', []), inicio: '2026-11-10T10:00:00.000Z', fim: '2026-11-10T11:00:00.000Z', pesoCorpoKg: 80 };
    expect(kcalDaSessao(s, 70)).toBe(400);
  });
  it('usa o peso do perfil quando a sessão não tem peso', () => {
    const s = { ...sessao('k', '2026-11-10', []), inicio: '2026-11-10T10:00:00.000Z', fim: '2026-11-10T10:30:00.000Z' };
    expect(kcalDaSessao(s, 70)).toBe(175);
  });
});
