/** Tipos de refeição, na ordem do dia */
export const TIPOS_REFEICAO = ['cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia', 'outro'] as const;
export type TipoRefeicao = (typeof TIPOS_REFEICAO)[number];

/** Um alimento dentro da refeição (do banco, de uma receita ou digitado) */
export interface ItemRefeicao {
  nome: string;
  gramas?: number;
  kcal: number;
  proteinaG: number;
  carboidratoG?: number;
  gorduraG?: number;
  fibraG?: number;
}

export interface Refeicao {
  id: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  /** Resumo exibido na lista (ex.: "Arroz, Feijão, Frango") */
  nome: string;
  kcal: number;
  proteinaG: number;
  carboidratoG?: number;
  gorduraG?: number;
  fibraG?: number;
  tipo?: TipoRefeicao;
  /** Nome livre quando tipo = 'outro' */
  tipoPersonalizado?: string;
  itens?: ItemRefeicao[];
  /** Foto do prato, salva só no aparelho */
  fotoUri?: string;
  observacoes?: string;
}

/** Sugere o tipo de refeição pelo horário */
export function tipoPeloHorario(horario: string): TipoRefeicao {
  const h = Number(horario.split(':')[0]);
  if (h < 10) return 'cafe';
  if (h < 12) return 'lanche_manha';
  if (h < 15) return 'almoco';
  if (h < 18) return 'lanche_tarde';
  if (h < 21) return 'jantar';
  return 'ceia';
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
  /** true depois de trazer as refeições do antigo módulo Diabetes */
  migradoRefeicoesDiabetes?: boolean;
  /** Lembrete "próxima refeição" pendente (só um por vez) */
  lembreteRefeicaoId?: string | null;
}

export const registrosVazios: RecordsData = {
  refeicoes: [],
  aguas: [],
  pesos: [],
  exercicios: [],
  migradoRefeicoesDiabetes: false,
  lembreteRefeicaoId: null,
};
