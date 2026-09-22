export const colors = {
  primary: '#6FA58E',      // Sálvia — natureza, saúde, calma
  accent: '#B7A6E0',       // Lavanda — premium, delicadeza
  secondary: '#F4A983',    // Pêssego — calor humano, nutrição
  background: '#FBF8F3',   // Marfim quente (em vez de branco clínico)
  surface: '#FFFFFF',
  text: '#2E3A35',         // Verde-carvão (em vez de preto puro)
  textSecondary: '#8B8578',
  border: '#EEEBE5',
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
  }
};

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
