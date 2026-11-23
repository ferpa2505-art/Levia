import {
  mapearGrupoRecords,
  seriesPorGrupoRecords,
  DISTRIBUICAO_GRUPOS_POR_EXERCICIO,
} from '../src/utils/fitnessLogica';
import type { RegistroExercicio } from '../src/types/records';
import type { GrupoMuscular } from '../src/types/fitness';

const exercicio = (over: Partial<RegistroExercicio> = {}): RegistroExercicio => ({
  id: '1',
  data: '2026-11-10',
  horario: '10:00',
  nome: 'Corrida',
  duracaoMin: 30,
  kcalGasto: 300,
  ...over,
});

describe('mapearGrupoRecords', () => {
  it('mapeia nomes em pt-BR para GrupoMuscular', () => {
    expect(mapearGrupoRecords('peito')).toBe('peito');
    expect(mapearGrupoRecords('costas')).toBe('costas');
    expect(mapearGrupoRecords('ombros')).toBe('ombros');
    expect(mapearGrupoRecords('biceps')).toBe('biceps');
    expect(mapearGrupoRecords('triceps')).toBe('triceps');
    expect(mapearGrupoRecords('antebraco')).toBe('antebraco');
    expect(mapearGrupoRecords('core')).toBe('core');
    expect(mapearGrupoRecords('quadriceps')).toBe('quadriceps');
    expect(mapearGrupoRecords('posteriores')).toBe('posteriores');
    expect(mapearGrupoRecords('gluteos')).toBe('gluteos');
    expect(mapearGrupoRecords('panturrilha')).toBe('panturrilha');
    expect(mapearGrupoRecords('cardio')).toBe('cardio');
    expect(mapearGrupoRecords('corpo inteiro')).toBe('corpoInteiro');
    expect(mapearGrupoRecords('funcional')).toBe('corpoInteiro');
  });

  it('mapeia nomes em inglês para GrupoMuscular', () => {
    expect(mapearGrupoRecords('chest')).toBe('peito');
    expect(mapearGrupoRecords('back')).toBe('costas');
    expect(mapearGrupoRecords('lats')).toBe('costas');
    expect(mapearGrupoRecords('shoulders')).toBe('ombros');
    expect(mapearGrupoRecords('deltoide')).toBe('ombros');
    expect(mapearGrupoRecords('bicep')).toBe('biceps');
    expect(mapearGrupoRecords('tricep')).toBe('triceps');
    expect(mapearGrupoRecords('forearm')).toBe('antebraco');
    expect(mapearGrupoRecords('abs')).toBe('core');
    expect(mapearGrupoRecords('abdominal')).toBe('core');
    expect(mapearGrupoRecords('quads')).toBe('quadriceps');
    expect(mapearGrupoRecords('hamstrings')).toBe('posteriores');
    expect(mapearGrupoRecords('hamstring')).toBe('posteriores');
    expect(mapearGrupoRecords('glutes')).toBe('gluteos');
    expect(mapearGrupoRecords('bumbum')).toBe('gluteos');
    expect(mapearGrupoRecords('calves')).toBe('panturrilha');
    expect(mapearGrupoRecords('aerobico')).toBe('cardio');
    expect(mapearGrupoRecords('aeróbico')).toBe('cardio');
    expect(mapearGrupoRecords('fullbody')).toBe('corpoInteiro');
    expect(mapearGrupoRecords('full body')).toBe('corpoInteiro');
  });

  it('ignora case e espaços extras', () => {
    expect(mapearGrupoRecords('  PEITO  ')).toBe('peito');
    expect(mapearGrupoRecords('CoStAs')).toBe('costas');
  });

  it('retorna null para grupo não reconhecido', () => {
    expect(mapearGrupoRecords('desconhecido')).toBeNull();
    expect(mapearGrupoRecords('')).toBeNull();
    expect(mapearGrupoRecords(undefined)).toBeNull();
  });
});

describe('DISTRIBUICAO_GRUPOS_POR_EXERCICIO', () => {
  it('tem entrada para todos os 20 tipos de exercício do records', () => {
    const expectedKeys = [
      'caminhada', 'corrida', 'ciclismo', 'natacao', 'musculacao',
      'funcional', 'hiit', 'crossfit', 'yoga', 'pilates',
      'alongamento', 'danca', 'pular-corda', 'escadas', 'eliptico',
      'futebol', 'volei', 'basquete', 'tenis',
    ];
    for (const key of expectedKeys) {
      expect(DISTRIBUICAO_GRUPOS_POR_EXERCICIO[key]).toBeDefined();
    }
  });

  it('musculacao tem objeto vazio (usa seleção manual)', () => {
    expect(DISTRIBUICAO_GRUPOS_POR_EXERCICIO.musculacao).toEqual({});
  });

  it('alongamento tem objeto vazio (sem estímulo hipertrofico)', () => {
    expect(DISTRIBUICAO_GRUPOS_POR_EXERCICIO.alongamento).toEqual({});
  });

  it('cardio puro foca em membros inferiores + core', () => {
    const c = DISTRIBUICAO_GRUPOS_POR_EXERCICIO.corrida;
    expect(c.quadriceps).toBeGreaterThan(0.5);
    expect(c.posteriores).toBeGreaterThan(0.5);
    expect(c.panturrilha).toBeGreaterThan(0.5);
    expect(c.core).toBeGreaterThan(0);
    expect(c.gluteos).toBeGreaterThan(0);
  });

  it('natação trabalha corpo inteiro com ênfase superior', () => {
    const n = DISTRIBUICAO_GRUPOS_POR_EXERCICIO.natacao;
    expect(n.peito).toBeGreaterThan(0);
    expect(n.costas).toBeGreaterThan(0);
    expect(n.ombros).toBeGreaterThan(0.8);
    expect(n.biceps).toBeGreaterThan(0);
    expect(n.triceps).toBeGreaterThan(0);
    expect(n.core).toBeGreaterThan(0);
  });

  it('esportes coletivos combinam cardio + inferiores + alguns superiores', () => {
    const f = DISTRIBUICAO_GRUPOS_POR_EXERCICIO.futebol;
    expect(f.quadriceps).toBeGreaterThan(0.7);
    expect(f.posteriores).toBeGreaterThan(0.6);
    expect(f.core).toBeGreaterThan(0);
    expect(f.ombros).toBeGreaterThan(0);

    const b = DISTRIBUICAO_GRUPOS_POR_EXERCICIO.basquete;
    expect(b.panturrilha).toBeGreaterThan(0.6);
    expect(b.ombros).toBeGreaterThan(0.4);
    expect(b.antebraco).toBeGreaterThan(0.2);
  });

  it('treinos de força têm distribuição ampla', () => {
    const cf = DISTRIBUICAO_GRUPOS_POR_EXERCICIO.crossfit;
    const grupos = Object.keys(cf) as GrupoMuscular[];
    expect(grupos.length).toBeGreaterThanOrEqual(10);
    expect(cf.core).toBeGreaterThan(0.7);
    expect(cf.quadriceps).toBeGreaterThan(0.7);
  });

  it('mobilidade tem contribuição baixa', () => {
    const y = DISTRIBUICAO_GRUPOS_POR_EXERCICIO.yoga;
    const valores = Object.values(y);
    expect(Math.max(...valores)).toBeLessThanOrEqual(0.3);
  });
});

describe('seriesPorGrupoRecords', () => {
  const inicioSemana = '2026-11-09'; // segunda-feira

  it('agrega exercícios da semana usando distribuição automática', () => {
    const exs: RegistroExercicio[] = [
      exercicio({ nome: 'Corrida', data: '2026-11-10', duracaoMin: 30 }),
      exercicio({ nome: 'Corrida', data: '2026-11-12', duracaoMin: 40 }),
    ];
    const result = seriesPorGrupoRecords(exs, inicioSemana);

    expect(result.quadriceps).toBeCloseTo(0.8 + 0.8, 1); // 2 corridas × 0.8
    expect(result.posteriores).toBeCloseTo(0.7 + 0.7, 1);
    expect(result.panturrilha).toBeCloseTo(0.7 + 0.7, 1);
    expect(result.core).toBeCloseTo(0.4 + 0.4, 1);
    expect(result.gluteos).toBeCloseTo(0.6 + 0.6, 1);
  });

  it('ignora exercícios fora do intervalo da semana', () => {
    const exs: RegistroExercicio[] = [
      exercicio({ nome: 'Corrida', data: '2026-11-02' }), // semana anterior
      exercicio({ nome: 'Corrida', data: '2026-11-10' }), // esta semana
    ];
    const result = seriesPorGrupoRecords(exs, inicioSemana);
    expect(result.quadriceps).toBe(0.8); // só a da semana atual
  });

  it('prioriza grupoMuscular manual sobre distribuição automática', () => {
    const exs: RegistroExercicio[] = [
      exercicio({ nome: 'Corrida', grupoMuscular: 'peito', data: '2026-11-10' }),
    ];
    const result = seriesPorGrupoRecords(exs, inicioSemana);
    // grupoMuscular manual 'peito' vira 1 série completa no peito
    expect(result.peito).toBe(1);
    // não deve ter distribuição de corrida
    expect(result.quadriceps).toBeUndefined();
  });

  it('grupoMuscular manual "cardio" distribui para GRUPOS_CARDIO com peso 0.5', () => {
    const exs: RegistroExercicio[] = [
      exercicio({ nome: 'EsporteNovo', grupoMuscular: 'cardio', data: '2026-11-10' }),
    ];
    const result = seriesPorGrupoRecords(exs, inicioSemana);
    expect(result.core).toBe(0.5);
    expect(result.quadriceps).toBe(0.5);
    expect(result.posteriores).toBe(0.5);
    expect(result.panturrilha).toBe(0.5);
  });

  it('grupoMuscular manual "corpo inteiro" distribui para 10 grupos com peso 0.5', () => {
    const exs: RegistroExercicio[] = [
      exercicio({ nome: 'TreinoNovo', grupoMuscular: 'corpo inteiro', data: '2026-11-10' }),
    ];
    const result = seriesPorGrupoRecords(exs, inicioSemana);
    const gruposEsperados: GrupoMuscular[] = [
      'peito', 'costas', 'ombros', 'biceps', 'triceps',
      'core', 'quadriceps', 'posteriores', 'gluteos', 'panturrilha',
    ];
    for (const g of gruposEsperados) {
      expect(result[g]).toBe(0.5);
    }
  });

  it('ignora exercício sem distribuição automática e sem grupoMuscular manual', () => {
    const exs: RegistroExercicio[] = [
      exercicio({ nome: 'alongamento', data: '2026-11-10' }), // distribuição vazia
    ];
    const result = seriesPorGrupoRecords(exs, inicioSemana);
    expect(Object.keys(result).length).toBe(0);
  });

  it('soma múltiplos exercícios diferentes na mesma semana', () => {
    const exs: RegistroExercicio[] = [
      exercicio({ nome: 'Corrida', data: '2026-11-10' }),
      exercicio({ nome: 'Musculação', grupoMuscular: 'peito', data: '2026-11-11' }),
      exercicio({ nome: 'Natacao', data: '2026-11-12' }), // sem acento para matching
    ];
    const result = seriesPorGrupoRecords(exs, inicioSemana);

    // Corrida
    expect(result.quadriceps).toBeGreaterThan(0);
    // Musculação manual peito
    expect(result.peito).toBeGreaterThanOrEqual(1);
    // Natação
    expect(result.ombros).toBeGreaterThan(0);
    expect(result.costas).toBeGreaterThan(0);
  });

  it('busca por ID do exercício também funciona (fallback)', () => {
    const exs: RegistroExercicio[] = [
      { ...exercicio({ nome: 'Corrida', id: 'corrida', data: '2026-11-10' }) },
    ];
    const result = seriesPorGrupoRecords(exs, inicioSemana);
    expect(result.quadriceps).toBe(0.8);
  });
});