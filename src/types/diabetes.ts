export type NivelIntensidadeGlicemia = 'Baixa' | 'Normal' | 'Elevada' | 'Muito elevada';

export interface RegistroGlicemia {
  id: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  valor: number; // mg/dL
  unidade: 'mg/dL' | 'mmol/L';
  notas?: string;
}

export type FrequenciaAlarme = 'hora' | '2h' | '3h' | '4h' | '6h' | '8h' | '12h' | 'diaria' | 'semanal' | 'quinzenal' | 'mensal';
export type TipoMedicacao = 'insulina' | 'diabetes-tratamento' | 'outro';

export interface ConfiguracaoAlarme {
  ativado: boolean;
  frequencia: FrequenciaAlarme;
  horarios: string[]; // Horas no formato HH:mm
  diasDaSemana?: number[]; // 0-6 (domingo-sábado), para semanal
  diaDoMes?: number; // 1-28, para mensal/quinzenal
  usoContinuo?: boolean; // Se é medicação de uso contínuo
  notificacaoAtivada?: boolean;
  notificationIds?: string[]; // Notificações agendadas no aparelho para este alarme
}

export interface RegistroMedicacao {
  id: string;
  data: string;
  horario: string;
  medicamento: string;
  dosagem: string;
  observacoes?: string;
  tipo?: TipoMedicacao; // Novo: tipo de medicação
  alarme?: ConfiguracaoAlarme; // Novo: configuração de alarme
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
