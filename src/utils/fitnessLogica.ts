/**
 * Lógica pura do Guia de Treinos: progressão, 1RM, recordes, volume e planos.
 * Sem React e sem armazenamento, para ser testada isoladamente.
 */
import type {
  DadosFitness,
  Exercicio,
  ExercicioNaRotina,
  GrupoMuscular,
  Plano,
  Rotina,
  SerieRealizada,
  Sessao,
} from '@/types/fitness';

export const LIBRAS_POR_KG = 2.20462;

/** Data local no formato YYYY-MM-DD */
export function dataISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Índice do plano: 0 = segunda … 6 = domingo, independente da configuração de início da semana. */
export function indicePlano(data: Date): number {
  return (data.getDay() + 6) % 7;
}

export function pesoParaExibir(kg: number, unidade: 'kg' | 'lb'): number {
  return unidade === 'kg' ? kg : Math.round(kg * LIBRAS_POR_KG * 10) / 10;
}

export function pesoDeExibicao(valor: number, unidade: 'kg' | 'lb'): number {
  return unidade === 'kg' ? valor : valor / LIBRAS_POR_KG;
}

export function arredondarCarga(valor: number, incremento: number): number {
  if (incremento <= 0) return Math.round(valor * 10) / 10;
  return Math.round(valor / incremento) * incremento;
}

/** 1RM estimado (Epley). Não estima acima de 12 repetições, onde a fórmula perde precisão. */
export function estimativa1RM(cargaKg: number, reps: number): number | undefined {
  if (!(cargaKg > 0) || reps < 1 || reps > 12) return undefined;
  return Math.round(cargaKg * (1 + reps / 30) * 10) / 10;
}

export function seriesDeTrabalhoFeitas(series: SerieRealizada[], exercicioId?: string): SerieRealizada[] {
  return series.filter(
    (s) => s.feita && s.tipo === 'trabalho' && (exercicioId === undefined || s.exercicioId === exercicioId),
  );
}

/** Sessões ordenadas da mais recente para a mais antiga. */
export function sessoesRecentes(sessoes: Sessao[]): Sessao[] {
  return [...sessoes].sort((a, b) => (a.inicio < b.inicio ? 1 : a.inicio > b.inicio ? -1 : 0));
}

/** Última vez que o exercício foi feito (séries de trabalho), antes de `antesDeSessaoId` se informado. */
export function ultimasSeriesDoExercicio(
  sessoes: Sessao[],
  exercicioId: string,
  antesDeSessaoId?: string,
): SerieRealizada[] | undefined {
  for (const s of sessoesRecentes(sessoes)) {
    if (s.id === antesDeSessaoId) continue;
    const feitas = seriesDeTrabalhoFeitas(s.series, exercicioId);
    if (feitas.length > 0) return feitas;
  }
  return undefined;
}

export type MotivoMeta =
  | 'primeira'
  | 'sobe'
  | 'repsSobem'
  | 'reinicia'
  | 'mantem'
  | 'semProgressao'
  | 'corpo';

export interface MetaExercicio {
  cargaKg?: number;
  repsAlvo: number;
  series: number;
  motivo: MotivoMeta;
}

/**
 * Meta da próxima vez que o exercício for feito, a partir da última execução.
 * - linear: soma o incremento quando completa todas as séries no mínimo de reps.
 * - dupla: reps sobem dentro da faixa; ao chegar ao topo, sobe a carga e volta ao mínimo.
 * - nenhuma: repete o último treino.
 * - corpo / tempo: progride em repetições (ou segundos), sem carga.
 */
export function metaDoExercicio(
  plano: ExercicioNaRotina,
  tipo: Exercicio['tipo'],
  ultimas: SerieRealizada[] | undefined,
  incrementoKg: number,
): MetaExercicio {
  const base = { series: plano.series };
  if (!ultimas || ultimas.length === 0) {
    return { ...base, repsAlvo: plano.repMin, motivo: 'primeira' };
  }

  const reps = ultimas.map((s) => s.repeticoes);
  const minReps = Math.min(...reps);
  const maxReps = Math.max(...reps);
  const completou = ultimas.length >= plano.series;
  const cargaUltima = Math.max(...ultimas.map((s) => s.cargaKg ?? 0));
  const cargaKg = cargaUltima > 0 ? cargaUltima : undefined;

  if (tipo !== 'carga') {
    const repsAlvo = completou && minReps >= plano.repMin ? Math.min(maxReps + 1, plano.repMax) : maxReps;
    return { ...base, repsAlvo, motivo: 'corpo' };
  }

  if (plano.progressao === 'nenhuma') {
    return { ...base, cargaKg, repsAlvo: plano.repMin, motivo: 'semProgressao' };
  }

  if (plano.progressao === 'linear') {
    if (completou && minReps >= plano.repMin) {
      return {
        ...base,
        cargaKg: cargaKg !== undefined ? arredondarCarga(cargaKg + incrementoKg, incrementoKg) : undefined,
        repsAlvo: plano.repMin,
        motivo: 'sobe',
      };
    }
    return { ...base, cargaKg, repsAlvo: plano.repMin, motivo: 'mantem' };
  }

  // dupla progressão
  if (completou && minReps >= plano.repMax) {
    return {
      ...base,
      cargaKg: cargaKg !== undefined ? arredondarCarga(cargaKg + incrementoKg, incrementoKg) : undefined,
      repsAlvo: plano.repMin,
      motivo: 'reinicia',
    };
  }
  if (completou) {
    return { ...base, cargaKg, repsAlvo: Math.min(maxReps + 1, plano.repMax), motivo: 'repsSobem' };
  }
  return { ...base, cargaKg, repsAlvo: minReps, motivo: 'mantem' };
}

/** Melhor 1RM estimado já registrado para o exercício, excluindo a sessão indicada. */
export function melhor1RMAnterior(sessoes: Sessao[], exercicioId: string, excluirSessaoId?: string): number | undefined {
  let melhor: number | undefined;
  for (const s of sessoes) {
    if (s.id === excluirSessaoId) continue;
    for (const serie of seriesDeTrabalhoFeitas(s.series, exercicioId)) {
      const e = estimativa1RM(serie.cargaKg ?? 0, serie.repeticoes);
      if (e !== undefined && (melhor === undefined || e > melhor)) melhor = e;
    }
  }
  return melhor;
}

/** Volume (carga × reps) por grupo muscular, somando as sessões desde `desde` (YYYY-MM-DD). */
export function volumePorGrupo(
  sessoes: Sessao[],
  grupoDe: (exercicioId: string) => GrupoMuscular | undefined,
  desde?: string,
): Partial<Record<GrupoMuscular, number>> {
  const total: Partial<Record<GrupoMuscular, number>> = {};
  for (const s of sessoes) {
    if (desde && s.data < desde) continue;
    for (const serie of seriesDeTrabalhoFeitas(s.series)) {
      const grupo = grupoDe(serie.exercicioId);
      if (!grupo || !serie.cargaKg) continue;
      total[grupo] = (total[grupo] ?? 0) + serie.cargaKg * serie.repeticoes;
    }
  }
  return total;
}

/** Minutos treinados por dia (YYYY-MM-DD). */
export function minutosPorDia(sessoes: Sessao[]): Record<string, number> {
  const mapa: Record<string, number> = {};
  for (const s of sessoes) {
    const min = Math.max(0, Math.round((new Date(s.fim).getTime() - new Date(s.inicio).getTime()) / 60000));
    mapa[s.data] = (mapa[s.data] ?? 0) + min;
  }
  return mapa;
}

/** Troca duas posições da semana (usado para mover um treino de dia sem mexer no resto do plano). */
export function trocarDias(plano: Plano, a: number, b: number): Plano {
  const semana = [...plano.semana];
  [semana[a], semana[b]] = [semana[b], semana[a]];
  return { semana };
}

export function rotinaDoDia(dados: Pick<DadosFitness, 'plano' | 'rotinas'>, data: Date): Rotina | undefined {
  const id = dados.plano.semana[indicePlano(data)];
  return id ? dados.rotinas.find((r) => r.id === id) : undefined;
}

/** Planos iniciais, com exercícios da biblioteca. */
export type PlanoInicialId = 'ppl' | 'upperLower' | 'fullBody' | 'cincoPorCinco';

function ex(exercicioId: string, series: number, repMin: number, repMax: number, progressao: ExercicioNaRotina['progressao'], descansoSeg = 90): ExercicioNaRotina {
  return { exercicioId, series, repMin, repMax, descansoSeg, progressao };
}

export function criarPlanoInicial(id: PlanoInicialId, agora: string): { rotinas: Rotina[]; plano: Plano } {
  const rotina = (idRotina: string, nome: string, exercicios: ExercicioNaRotina[]): Rotina => ({
    id: idRotina,
    nome,
    exercicios,
    criadaEm: agora,
  });

  switch (id) {
    case 'ppl': {
      const rotinas = [
        rotina('ppl-push', 'Push (empurrar)', [
          ex('supino-reto-barra', 4, 6, 10, 'dupla', 150),
          ex('desenvolvimento-halter', 3, 8, 12, 'dupla'),
          ex('supino-inclinado-halter', 3, 8, 12, 'dupla'),
          ex('elevacao-lateral-halter', 3, 12, 15, 'dupla', 60),
          ex('triceps-polia-corda', 3, 10, 15, 'dupla', 60),
        ]),
        rotina('ppl-pull', 'Pull (puxar)', [
          ex('barra-fixa', 4, 6, 10, 'dupla', 150),
          ex('remada-curvada-barra', 3, 8, 12, 'dupla'),
          ex('puxada-frontal', 3, 10, 12, 'dupla'),
          ex('face-pull', 3, 12, 15, 'dupla', 60),
          ex('rosca-direta-barra', 3, 8, 12, 'dupla', 60),
        ]),
        rotina('ppl-legs', 'Legs (pernas)', [
          ex('agachamento-livre', 4, 6, 10, 'linear', 150),
          ex('stiff-halter', 3, 8, 12, 'dupla'),
          ex('leg-press', 3, 10, 15, 'dupla'),
          ex('mesa-flexora', 3, 10, 12, 'dupla', 60),
          ex('panturrilha-em-pe', 4, 10, 15, 'dupla', 45),
        ]),
      ];
      return {
        rotinas,
        plano: { semana: ['ppl-push', 'ppl-pull', 'ppl-legs', 'ppl-push', 'ppl-pull', 'ppl-legs', null] },
      };
    }
    case 'upperLower': {
      const rotinas = [
        rotina('ul-upper', 'Superior', [
          ex('supino-reto-barra', 4, 6, 10, 'dupla', 120),
          ex('remada-curvada-barra', 4, 6, 10, 'dupla', 120),
          ex('desenvolvimento-halter', 3, 8, 12, 'dupla'),
          ex('puxada-frontal', 3, 10, 12, 'dupla'),
          ex('rosca-direta-barra', 2, 10, 12, 'dupla', 60),
          ex('triceps-polia-corda', 2, 10, 12, 'dupla', 60),
        ]),
        rotina('ul-lower', 'Inferior', [
          ex('agachamento-livre', 4, 5, 8, 'linear', 150),
          ex('levantamento-terra-romeno', 3, 8, 10, 'dupla'),
          ex('leg-press', 3, 10, 12, 'dupla'),
          ex('cadeira-flexora', 3, 10, 12, 'dupla', 60),
          ex('panturrilha-em-pe', 3, 10, 15, 'dupla', 45),
        ]),
      ];
      return {
        rotinas,
        plano: { semana: ['ul-upper', null, 'ul-lower', null, 'ul-upper', null, 'ul-lower'] },
      };
    }
    case 'fullBody': {
      const rotinas = [
        rotina('fb-a', 'Corpo inteiro', [
          ex('agachamento-livre', 3, 6, 10, 'linear', 120),
          ex('supino-reto-halter', 3, 8, 12, 'dupla'),
          ex('remada-serrote', 3, 8, 12, 'dupla'),
          ex('desenvolvimento-halter', 2, 8, 12, 'dupla'),
          ex('prancha', 3, 30, 60, 'nenhuma', 45),
        ]),
      ];
      return {
        rotinas,
        plano: { semana: ['fb-a', null, 'fb-a', null, 'fb-a', null, null] },
      };
    }
    case 'cincoPorCinco': {
      const rotinas = [
        rotina('5x5-a', '5×5 A', [
          ex('agachamento-livre', 5, 5, 5, 'linear', 180),
          ex('supino-reto-barra', 5, 5, 5, 'linear', 180),
          ex('remada-curvada-barra', 5, 5, 5, 'linear', 150),
        ]),
        rotina('5x5-b', '5×5 B', [
          ex('agachamento-livre', 5, 5, 5, 'linear', 180),
          ex('desenvolvimento-barra', 5, 5, 5, 'linear', 150),
          ex('levantamento-terra', 1, 5, 5, 'linear', 180),
        ]),
      ];
      return {
        rotinas,
        plano: { semana: ['5x5-a', null, '5x5-b', null, '5x5-a', null, null] },
      };
    }
  }
}

/** Nome do dia da semana (indice: 0 = segunda) no idioma do app. */
export function nomeDiaSemana(indice: number, idioma: string, estilo: 'short' | 'long'): string {
  // 1 de janeiro de 2024 foi uma segunda-feira
  const d = new Date(2024, 0, 1 + indice);
  try {
    return d.toLocaleDateString(idioma, { weekday: estilo });
  } catch {
    return d.toLocaleDateString('pt-BR', { weekday: estilo });
  }
}

/** Data ISO do início da semana (segunda ou domingo, conforme a configuração) que contém `hoje`. */
export function inicioDaSemanaISO(hoje: Date, inicioSemana: 'seg' | 'dom'): string {
  const deslocamento = inicioSemana === 'dom' ? hoje.getDay() : (hoje.getDay() + 6) % 7;
  return dataISO(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - deslocamento));
}

/** Séries de trabalho feitas por grupo muscular desde `desdeISO` (YYYY-MM-DD). */
export function seriesPorGrupo(
  sessoes: Sessao[],
  grupoDe: (exercicioId: string) => GrupoMuscular | undefined,
  desdeISO: string,
): Partial<Record<GrupoMuscular, number>> {
  const total: Partial<Record<GrupoMuscular, number>> = {};
  for (const s of sessoes) {
    if (s.data < desdeISO) continue;
    for (const serie of seriesDeTrabalhoFeitas(s.series)) {
      const grupo = grupoDe(serie.exercicioId);
      if (!grupo) continue;
      total[grupo] = (total[grupo] ?? 0) + 1;
    }
  }
  return total;
}

/** Datas ISO dos dias da semana que têm sessão. */
export function diasComTreinoDesde(sessoes: Sessao[], desdeISO: string): Set<string> {
  return new Set(sessoes.filter((s) => s.data >= desdeISO).map((s) => s.data));
}

/**
 * Gasto estimado de uma sessão do Guia de Treinos: MET de treino de força geral (5,0) × peso × horas.
 * É uma estimativa: usa o peso corporal da sessão (se informado) ou o do perfil.
 */
export const MET_TREINO_FORCA = 5;
export function kcalDaSessao(sessao: Sessao, pesoPadraoKg: number): number {
  const minutos = Math.min(240, Math.max(0, (new Date(sessao.fim).getTime() - new Date(sessao.inicio).getTime()) / 60000));
  const peso = sessao.pesoCorpoKg ?? pesoPadraoKg;
  return Math.round(MET_TREINO_FORCA * peso * (minutos / 60));
}
