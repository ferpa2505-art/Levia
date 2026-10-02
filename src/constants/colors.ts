/**
 * TEMAS DO LEVIA
 *
 * O objeto `colors` é usado no app inteiro. Quando o tema muda, os valores
 * dele são trocados por aplicarTema() e o app é remontado (ver app/_layout.tsx),
 * então todas as telas passam a usar as cores novas.
 */

export type NomeTema = 'salvia' | 'petroleo' | 'grafite';

/** Temas com fundo escuro (barra de status com ícones claros) */
export const TEMAS_ESCUROS: NomeTema[] = ['grafite'];

const temas = {
  // Tema original — Sálvia (verde suave, acolhedor)
  salvia: {
    primary: '#6FA58E',      // Sálvia — natureza, saúde, calma
    accent: '#B7A6E0',       // Lavanda — premium, delicadeza
    secondary: '#F4A983',    // Pêssego — calor humano, nutrição
    background: '#FBF8F3',   // Marfim quente (em vez de branco clínico)
    surface: '#FFFFFF',
    text: '#2E3A35',         // Verde-carvão (em vez de preto puro)
    textSecondary: '#8B8578',
    border: '#EEEBE5',
    primarySoft: 'rgba(111,165,142,0.12)',
    accentSoft: 'rgba(183,166,224,0.18)',
    secondarySoft: 'rgba(244,169,131,0.18)',
  },

  // Tema Azul-petróleo — mais sóbrio/masculino, puxado do degradê da abertura
  petroleo: {
    primary: '#0A6E80',      // Azul-petróleo
    accent: '#6FA3C7',       // Azul-aço
    secondary: '#F29E6D',    // Pêssego mais forte (o ponto da pena)
    background: '#F3F6F7',   // Cinza-azulado bem claro
    surface: '#FFFFFF',
    text: '#1B2B33',         // Azul-grafite
    textSecondary: '#66788A',
    border: '#DDE5E9',
    primarySoft: 'rgba(10,110,128,0.12)',
    accentSoft: 'rgba(111,163,199,0.18)',
    secondarySoft: 'rgba(242,158,109,0.18)',
  },

  // Tema Grafite — escuro, cinza quente com destaques em laranja
  grafite: {
    primary: '#D97757',      // Laranja-terracota (destaques, botões, ícones ativos)
    accent: '#E0A458',       // Âmbar
    secondary: '#E8956F',    // Laranja claro
    background: '#262624',   // Grafite
    surface: '#30302E',      // Cartões
    text: '#F5F4EF',
    textSecondary: '#A8A69E',
    border: '#3E3D39',
    primarySoft: 'rgba(217,119,87,0.16)',
    accentSoft: 'rgba(224,164,88,0.18)',
    secondarySoft: 'rgba(232,149,111,0.18)',
  },
};

export const colors = {
  ...temas.salvia,
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Modo escuro
  dark: {
    background: '#1A1F1C',
    surface: '#2E3A35',
    text: '#FBF8F3',
    textSecondary: '#B8B1A7',
    border: '#3A4240',
  },
};

let temaAtual: NomeTema = 'salvia';
let versaoTema = 0;

/** Troca as cores do app para o tema escolhido. */
export function aplicarTema(nome: NomeTema) {
  if (!temas[nome]) return;
  Object.assign(colors, temas[nome]);
  temaAtual = nome;
  versaoTema++;
}

export function obterTemaAtual(): NomeTema {
  return temaAtual;
}

export function obterVersaoTema(): number {
  return versaoTema;
}

export const typography = {
  family: {
    regular: 'System',
    semibold: 'System',
    bold: 'System',
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  weight: {
    regular: '400' as any,
    semibold: '600' as any,
    bold: '700' as any,
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};
