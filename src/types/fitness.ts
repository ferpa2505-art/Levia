/** Guia de Treinos: modelos próprios do Leviã (escritos do zero, sem código de terceiros). */

export type GrupoMuscular =
  | 'peito'
  | 'costas'
  | 'pernas'
  | 'ombros'
  | 'bracos'
  | 'core'
  | 'corpoInteiro';

export interface ExercicioBiblioteca {
  id: string;
  nome: string;
  grupo: GrupoMuscular;
}

/** Exercício dentro de um treino, com o plano de séries */
export interface ExercicioNoTreino {
  exercicioId: string;
  series: number;
  repeticoes: number;
  cargaKg?: number;
  descansoSeg: number;
}

export interface Treino {
  id: string;
  nome: string;
  exercicios: ExercicioNoTreino[];
  criadoEm: string;
}

/** Uma série realizada durante uma sessão */
export interface SerieRealizada {
  exercicioId: string;
  numero: number;
  repeticoes: number;
  cargaKg?: number;
  feita: boolean;
}

export interface SessaoTreino {
  id: string;
  treinoId: string;
  nomeTreino: string;
  data: string; // YYYY-MM-DD
  inicio: string; // ISO
  fim: string; // ISO
  series: SerieRealizada[];
}
