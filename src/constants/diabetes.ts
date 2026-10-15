export const MEDICAMENTOS_DIABETES = [
  'Metformina',
  'Insulina Rápida',
  'Insulina Basal',
  'Glibenclamida',
  'Pioglitazona',
  'GLP-1 (Semaglutida)',
  'Outro',
];

export const TIPOS_REFEICAO = [
  'Café da manhã',
  'Lanche da manhã',
  'Almoço',
  'Lanche da tarde',
  'Jantar',
  'Lanche noturno',
];

export const UNIDADES_GLICEMIA = [
  { label: 'mg/dL', valor: 'mg/dL' },
  { label: 'mmol/L', valor: 'mmol/L' },
];

// Faixas normais de glicemia em mg/dL
export const FAIXAS_GLICEMIA = {
  BAIXA: { min: 0, max: 70, label: 'Hipoglicemia', cor: 'error' },
  NORMAL: { min: 70, max: 100, label: 'Normal (em jejum)', cor: 'success' },
  PRE_DIABETES: { min: 100, max: 125, label: 'Pré-diabetes (em jejum)', cor: 'warning' },
  ELEVADA: { min: 126, max: 200, label: 'Elevada', cor: 'warning' },
  MUITO_ELEVADA: { min: 200, max: Infinity, label: 'Muito elevada', cor: 'error' },
};

export const DICAS_DIABETES = [
  'Realize medições regulares de glicemia',
  'Mantenha uma alimentação balanceada',
  'Pratique atividades físicas regularmente',
  'Tome os medicamentos conforme prescrito',
  'Monitore o consumo de carboidratos',
  'Mantenha um registro das refeições',
  'Durma bem e reduza o estresse',
];
