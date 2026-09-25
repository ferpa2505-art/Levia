export type NivelIntensidadeGlicemia = 'Baixa' | 'Normal' | 'Elevada' | 'Muito elevada';

export interface RegistroGlicemia {
  id: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  valor: number; // mg/dL
  unidade: 'mg/dL' | 'mmol/L';
  notas?: string;
}

export interface RegistroMedicacao {
  id: string;
  data: string;
  horario: string;
  medicamento: string;
  dosagem: string;
  observacoes?: string;
}

export interface RegistroRefeicao {
  id: string;
  data: string;
  horario: string;
  tipo: string; // Café, Almoço, Lanche, Jantar
  carboidratos: number; // em gramas
  alimentos?: string;
  observacoes?: string;
}

export interface NotaDiaria {
  id: string;
  data: string;
  conteudo: string;
  timestamp: string; // HH:mm
}

export interface DiabetesData {
  glicemias: RegistroGlicemia[];
  medicacoes: RegistroMedicacao[];
  refeicoes: RegistroRefeicao[];
  notas: NotaDiaria[];
}

export const diabetesDadosVazios: DiabetesData = {
  glicemias: [],
  medicacoes: [],
  refeicoes: [],
  notas: [],
};
