/**
 * Guia de Treinos: modelos próprios do Leviã.
 * Escritos do zero, com base nas funcionalidades descritas pelo produto de referência.
 */

export type GrupoMuscular =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'core'
  | 'quadriceps'
  | 'posteriores'
  | 'gluteos'
  | 'panturrilha'
  | 'cardio'
  | 'corpoInteiro';

export type Equipamento =
  | 'peso-livre'
  | 'barra'
  | 'halter'
  | 'maquina'
  | 'cabo'
  | 'kettlebell'
  | 'elastico'
  | 'corpo'
  | 'outro';

/** carga: reps + peso · corpo: só reps (peso corporal) · tempo: segundos */
export type TipoExercicio = 'carga' | 'corpo' | 'tempo';

export interface Exercicio {
  id: string;
  nome: string;
  grupo: GrupoMuscular;
  equipamento: Equipamento;
  tipo: TipoExercicio;
  personalizado?: boolean;
}

export type Progressao = 'nenhuma' | 'linear' | 'dupla';

export interface ExercicioNaRotina {
  exercicioId: string;
  series: number;
  repMin: number;
  repMax: number;
  descansoSeg: number;
  progressao: Progressao;
}

export interface Rotina {
  id: string;
  nome: string;
  exercicios: ExercicioNaRotina[];
  criadaEm: string;
}

/** Sete posições, de segunda (0) a domingo (6). Cada posição guarda o id da rotina ou null. */
export interface Plano {
  semana: (string | null)[];
}

export type TipoSerie = 'aquecimento' | 'trabalho';

export interface SerieRealizada {
  exercicioId: string;
  numero: number;
  tipo: TipoSerie;
  repeticoes: number;
  cargaKg?: number;
  /** Repetições em reserva (0–5). Opcional: só entra se o usuário marcar. */
  rir?: number;
  feita: boolean;
}

export interface Sessao {
  id: string;
  data: string; // YYYY-MM-DD
  rotinaId?: string;
  nome: string;
  inicio: string; // ISO
  fim: string; // ISO
  pesoCorpoKg?: number;
  series: SerieRealizada[];
}

export interface Pesagem {
  id: string;
  data: string; // YYYY-MM-DD
  kg: number;
}

export interface Configuracoes {
  unidade: 'kg' | 'lb';
  inicioSemana: 'seg' | 'dom';
  manterTelaLigada: boolean;
  incrementoKg: number;
}

export interface DadosFitness {
  personalizados: Exercicio[];
  favoritos: string[];
  rotinas: Rotina[];
  plano: Plano;
  sessoes: Sessao[];
  pesagens: Pesagem[];
  metaPesoKg?: number;
  config: Configuracoes;
}

export const CONFIG_PADRAO: Configuracoes = {
  unidade: 'kg',
  inicioSemana: 'seg',
  manterTelaLigada: true,
  incrementoKg: 2.5,
};

export const PLANO_VAZIO: Plano = { semana: [null, null, null, null, null, null, null] };
