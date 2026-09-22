export interface Refeicao {
  id: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  nome: string;
  kcal: number;
  proteinaG: number;
}

export interface RegistroAgua {
  id: string;
  data: string;
  horario: string;
  ml: number;
}

export interface RegistroPeso {
  id: string;
  data: string;
  pesoKg: number;
}

export interface RegistroExercicio {
  id: string;
  data: string;
  horario: string;
  nome: string;
  duracaoMin: number;
  kcalGasto: number;
  intensidade?: string;
  local?: string;
  grupoMuscular?: string;
}

export interface RecordsData {
  refeicoes: Refeicao[];
  aguas: RegistroAgua[];
  pesos: RegistroPeso[];
  exercicios: RegistroExercicio[];
}

export const registrosVazios: RecordsData = {
  refeicoes: [],
  aguas: [],
  pesos: [],
  exercicios: [],
};
