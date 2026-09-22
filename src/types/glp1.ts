export type NivelIntensidadeSintoma = 'Leve' | 'Moderada' | 'Intensa';

export interface RegistroDoseGLP1 {
  id: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  medicamento: string;
  dosagemMg: number;
  local: string;
  observacoes?: string;
}

export interface RegistroSintomaGLP1 {
  id: string;
  data: string;
  horario: string;
  sintoma: string;
  intensidade: NivelIntensidadeSintoma;
  observacoes?: string;
}

export interface ConfiguracaoCaneta {
  mgTotalCaneta: number | null;
  cliquesTotaisCaneta: number | null;
}

export interface ConfiguracaoLembreteGLP1 {
  ativo: boolean;
  frequenciaDias: number;
  notificationId?: string | null;
}

export interface Glp1Data {
  doses: RegistroDoseGLP1[];
  sintomas: RegistroSintomaGLP1[];
  configCaneta: ConfiguracaoCaneta;
  configLembrete: ConfiguracaoLembreteGLP1;
}

export const glp1DadosVazios: Glp1Data = {
  doses: [],
  sintomas: [],
  configCaneta: { mgTotalCaneta: null, cliquesTotaisCaneta: null },
  configLembrete: { ativo: false, frequenciaDias: 7, notificationId: null },
};
