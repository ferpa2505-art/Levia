export const LOCAIS_APLICACAO = [
  'Abdômen (lado esquerdo)',
  'Abdômen (lado direito)',
  'Coxa (esquerda)',
  'Coxa (direita)',
  'Braço (esquerdo)',
  'Braço (direito)',
];

export const SINTOMAS_COMUNS = [
  'Náusea',
  'Vômito',
  'Diarreia',
  'Constipação',
  'Dor de cabeça',
  'Fadiga',
  'Tontura',
  'Azia / refluxo',
  'Dor no local da aplicação',
  'Perda de apetite',
  'Outro',
];

export const NIVEIS_INTENSIDADE_SINTOMA = ['Leve', 'Moderada', 'Intensa'] as const;

export const MEDICAMENTOS_GLP1 = ['Semaglutida', 'Tirzepatida', 'Liraglutida', 'Outro'];

export const FREQUENCIAS_LEMBRETE = [
  { label: 'Semanal', dias: 7 },
  { label: 'A cada 14 dias', dias: 14 },
  { label: 'Diária', dias: 1 },
];
