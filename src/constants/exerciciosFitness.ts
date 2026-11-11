import type { ExercicioBiblioteca } from '@/types/fitness';

/** Biblioteca inicial do Guia de Treinos. Nomes e grupos escritos pelo Leviã. */
export const BIBLIOTECA_EXERCICIOS: ExercicioBiblioteca[] = [
  { id: 'supino-reto', nome: 'Supino reto', grupo: 'peito' },
  { id: 'supino-inclinado', nome: 'Supino inclinado', grupo: 'peito' },
  { id: 'crucifixo', nome: 'Crucifixo', grupo: 'peito' },
  { id: 'flexao', nome: 'Flexão de braço', grupo: 'peito' },
  { id: 'puxada-frente', nome: 'Puxada frontal', grupo: 'costas' },
  { id: 'remada-curvada', nome: 'Remada curvada', grupo: 'costas' },
  { id: 'remada-baixa', nome: 'Remada baixa', grupo: 'costas' },
  { id: 'barra-fixa', nome: 'Barra fixa', grupo: 'costas' },
  { id: 'agachamento', nome: 'Agachamento livre', grupo: 'pernas' },
  { id: 'leg-press', nome: 'Leg press', grupo: 'pernas' },
  { id: 'cadeira-extensora', nome: 'Cadeira extensora', grupo: 'pernas' },
  { id: 'mesa-flexora', nome: 'Mesa flexora', grupo: 'pernas' },
  { id: 'stiff', nome: 'Stiff', grupo: 'pernas' },
  { id: 'panturrilha', nome: 'Panturrilha em pé', grupo: 'pernas' },
  { id: 'desenvolvimento', nome: 'Desenvolvimento com halteres', grupo: 'ombros' },
  { id: 'elevacao-lateral', nome: 'Elevação lateral', grupo: 'ombros' },
  { id: 'elevacao-frontal', nome: 'Elevação frontal', grupo: 'ombros' },
  { id: 'rosca-direta', nome: 'Rosca direta', grupo: 'bracos' },
  { id: 'rosca-martelo', nome: 'Rosca martelo', grupo: 'bracos' },
  { id: 'triceps-corda', nome: 'Tríceps na polia', grupo: 'bracos' },
  { id: 'triceps-frances', nome: 'Tríceps testa', grupo: 'bracos' },
  { id: 'prancha', nome: 'Prancha', grupo: 'core' },
  { id: 'abdominal-supra', nome: 'Abdominal supra', grupo: 'core' },
  { id: 'elevacao-pernas', nome: 'Elevação de pernas', grupo: 'core' },
  { id: 'burpee', nome: 'Burpee', grupo: 'corpoInteiro' },
  { id: 'levantamento-terra', nome: 'Levantamento terra', grupo: 'corpoInteiro' },
];

export function exercicioPorId(id: string): ExercicioBiblioteca | undefined {
  return BIBLIOTECA_EXERCICIOS.find((e) => e.id === id);
}
