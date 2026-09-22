export const NIVEIS_INTENSIDADE = ['Baixíssima', 'Baixa', 'Média', 'Alta', 'Altíssima'] as const;
export type NivelIntensidade = (typeof NIVEIS_INTENSIDADE)[number];

/**
 * Multiplicador aplicado sobre o kcal/min base do tipo de exercício,
 * de acordo com a intensidade escolhida. "Média" é o valor de
 * referência (multiplicador 1).
 */
export const MULTIPLICADOR_INTENSIDADE: Record<NivelIntensidade, number> = {
  'Baixíssima': 0.6,
  'Baixa': 0.8,
  'Média': 1,
  'Alta': 1.25,
  'Altíssima': 1.5,
};

export interface TipoExercicio {
  id: string;
  nome: string;
  /** Nome do ícone no conjunto MaterialCommunityIcons (@expo/vector-icons) */
  icone: string;
  /** kcal/min de referência, na intensidade "Média" */
  kcalPorMinutoBase: number;
  /** Se definido, o formulário pede o local onde o exercício foi feito */
  opcoesLocal?: string[];
  /** Se definido, o formulário pede o grupo muscular trabalhado */
  opcoesGrupoMuscular?: string[];
}

export const tiposExercicio: TipoExercicio[] = [
  {
    id: 'caminhada',
    nome: 'Caminhada',
    icone: 'walk',
    kcalPorMinutoBase: 5,
    opcoesLocal: ['Rua', 'Parque', 'Esteira', 'Trilha'],
  },
  {
    id: 'corrida',
    nome: 'Corrida',
    icone: 'run',
    kcalPorMinutoBase: 11,
    opcoesLocal: ['Rua', 'Parque', 'Esteira', 'Trilha'],
  },
  {
    id: 'ciclismo',
    nome: 'Ciclismo',
    icone: 'bike',
    kcalPorMinutoBase: 7,
    opcoesLocal: ['Rua', 'Ciclovia', 'Parque', 'Estrada', 'Bike ergométrica'],
  },
  {
    id: 'natacao',
    nome: 'Natação',
    icone: 'swim',
    kcalPorMinutoBase: 8,
    opcoesLocal: ['Piscina', 'Rio', 'Lago/Lagoa', 'Mar'],
  },
  {
    id: 'musculacao',
    nome: 'Academia',
    icone: 'dumbbell',
    kcalPorMinutoBase: 6,
    opcoesGrupoMuscular: ['Peito', 'Costas', 'Pernas', 'Braços', 'Ombros', 'Abdômen', 'Corpo todo'],
  },
  {
    id: 'funcional',
    nome: 'Treino funcional',
    icone: 'arm-flex',
    kcalPorMinutoBase: 9,
  },
  {
    id: 'hiit',
    nome: 'HIIT',
    icone: 'lightning-bolt',
    kcalPorMinutoBase: 12,
  },
  {
    id: 'crossfit',
    nome: 'Crossfit',
    icone: 'weight-lifter',
    kcalPorMinutoBase: 11,
  },
  {
    id: 'yoga',
    nome: 'Yoga',
    icone: 'yoga',
    kcalPorMinutoBase: 3,
  },
  {
    id: 'pilates',
    nome: 'Pilates',
    icone: 'human',
    kcalPorMinutoBase: 4,
  },
  {
    id: 'alongamento',
    nome: 'Alongamento',
    icone: 'human-handsup',
    kcalPorMinutoBase: 2.5,
  },
  {
    id: 'danca',
    nome: 'Dança',
    icone: 'dance-ballroom',
    kcalPorMinutoBase: 7,
  },
  {
    id: 'pular-corda',
    nome: 'Pular corda',
    icone: 'jump-rope',
    kcalPorMinutoBase: 12,
  },
  {
    id: 'escadas',
    nome: 'Subir escadas',
    icone: 'stairs',
    kcalPorMinutoBase: 9,
  },
  {
    id: 'eliptico',
    nome: 'Elíptico',
    icone: 'run-fast',
    kcalPorMinutoBase: 7,
  },
  {
    id: 'futebol',
    nome: 'Futebol',
    icone: 'soccer',
    kcalPorMinutoBase: 9,
  },
  {
    id: 'volei',
    nome: 'Vôlei',
    icone: 'volleyball',
    kcalPorMinutoBase: 4,
  },
  {
    id: 'basquete',
    nome: 'Basquete',
    icone: 'basketball',
    kcalPorMinutoBase: 8,
  },
  {
    id: 'tenis',
    nome: 'Tênis',
    icone: 'tennis',
    kcalPorMinutoBase: 7,
  },
];
