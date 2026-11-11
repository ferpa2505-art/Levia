import type { Equipamento, Exercicio, GrupoMuscular, TipoExercicio } from '@/types/fitness';

/**
 * Biblioteca do Guia de Treinos. Nomes, grupos e equipamentos escritos pelo Leviã.
 * Formato compacto: [id, nome, grupo, equipamento, tipo]
 */
type Linha = [string, string, GrupoMuscular, Equipamento, TipoExercicio];

const LINHAS: Linha[] = [
  // Peito
  ['supino-reto-barra', 'Supino reto com barra', 'peito', 'barra', 'carga'],
  ['supino-inclinado-barra', 'Supino inclinado com barra', 'peito', 'barra', 'carga'],
  ['supino-reto-halter', 'Supino reto com halteres', 'peito', 'halter', 'carga'],
  ['supino-inclinado-halter', 'Supino inclinado com halteres', 'peito', 'halter', 'carga'],
  ['supino-maquina', 'Supino na máquina', 'peito', 'maquina', 'carga'],
  ['crucifixo-halter', 'Crucifixo com halteres', 'peito', 'halter', 'carga'],
  ['crucifixo-cabo', 'Crucifixo no cabo', 'peito', 'cabo', 'carga'],
  ['peck-deck', 'Voador (peck deck)', 'peito', 'maquina', 'carga'],
  ['flexao-bracos', 'Flexão de braço', 'peito', 'corpo', 'corpo'],
  ['mergulho-paralelas', 'Mergulho nas paralelas', 'peito', 'corpo', 'corpo'],
  // Costas
  ['barra-fixa', 'Barra fixa', 'costas', 'corpo', 'corpo'],
  ['puxada-frontal', 'Puxada frontal', 'costas', 'cabo', 'carga'],
  ['puxada-triangulo', 'Puxada triângulo', 'costas', 'cabo', 'carga'],
  ['remada-curvada-barra', 'Remada curvada com barra', 'costas', 'barra', 'carga'],
  ['remada-serrote', 'Remada serrote', 'costas', 'halter', 'carga'],
  ['remada-baixa-cabo', 'Remada baixa no cabo', 'costas', 'cabo', 'carga'],
  ['remada-maquina', 'Remada na máquina', 'costas', 'maquina', 'carga'],
  ['pulldown-barra', 'Pulldown com corda', 'costas', 'cabo', 'carga'],
  ['hiperextensao', 'Hiperextensão lombar', 'costas', 'corpo', 'corpo'],
  ['encolhimento-halter', 'Encolhimento com halteres', 'costas', 'halter', 'carga'],
  // Ombros
  ['desenvolvimento-barra', 'Desenvolvimento com barra', 'ombros', 'barra', 'carga'],
  ['desenvolvimento-halter', 'Desenvolvimento com halteres', 'ombros', 'halter', 'carga'],
  ['desenvolvimento-maquina', 'Desenvolvimento na máquina', 'ombros', 'maquina', 'carga'],
  ['elevacao-lateral-halter', 'Elevação lateral com halteres', 'ombros', 'halter', 'carga'],
  ['elevacao-lateral-cabo', 'Elevação lateral no cabo', 'ombros', 'cabo', 'carga'],
  ['elevacao-frontal', 'Elevação frontal', 'ombros', 'halter', 'carga'],
  ['crucifixo-invertido', 'Crucifixo invertido', 'ombros', 'halter', 'carga'],
  ['face-pull', 'Face pull', 'ombros', 'cabo', 'carga'],
  ['arnold-press', 'Arnold press', 'ombros', 'halter', 'carga'],
  // Bíceps
  ['rosca-direta-barra', 'Rosca direta com barra', 'biceps', 'barra', 'carga'],
  ['rosca-alternada-halter', 'Rosca alternada com halteres', 'biceps', 'halter', 'carga'],
  ['rosca-martelo', 'Rosca martelo', 'biceps', 'halter', 'carga'],
  ['rosca-scott', 'Rosca Scott', 'biceps', 'maquina', 'carga'],
  ['rosca-cabo', 'Rosca no cabo', 'biceps', 'cabo', 'carga'],
  ['rosca-concentrada', 'Rosca concentrada', 'biceps', 'halter', 'carga'],
  // Tríceps
  ['triceps-polia-corda', 'Tríceps na polia com corda', 'triceps', 'cabo', 'carga'],
  ['triceps-polia-barra', 'Tríceps na polia com barra', 'triceps', 'cabo', 'carga'],
  ['triceps-testa', 'Tríceps testa', 'triceps', 'barra', 'carga'],
  ['triceps-frances', 'Tríceps francês com halter', 'triceps', 'halter', 'carga'],
  ['triceps-coice', 'Tríceps coice', 'triceps', 'halter', 'carga'],
  ['mergulho-banco', 'Mergulho no banco', 'triceps', 'corpo', 'corpo'],
  ['supino-fechado', 'Supino fechado', 'triceps', 'barra', 'carga'],
  // Antebraço
  ['rosca-punho', 'Rosca de punho', 'antebraco', 'halter', 'carga'],
  ['rosca-punho-inversa', 'Rosca de punho inversa', 'antebraco', 'barra', 'carga'],
  ['farmer-carry', 'Caminhada do fazendeiro', 'antebraco', 'halter', 'carga'],
  // Quadríceps
  ['agachamento-livre', 'Agachamento livre', 'quadriceps', 'barra', 'carga'],
  ['agachamento-frontal', 'Agachamento frontal', 'quadriceps', 'barra', 'carga'],
  ['agachamento-goblet', 'Agachamento goblet', 'quadriceps', 'kettlebell', 'carga'],
  ['leg-press', 'Leg press 45°', 'quadriceps', 'maquina', 'carga'],
  ['cadeira-extensora', 'Cadeira extensora', 'quadriceps', 'maquina', 'carga'],
  ['afundo', 'Afundo', 'quadriceps', 'halter', 'carga'],
  ['agachamento-bulgaro', 'Agachamento búlgaro', 'quadriceps', 'halter', 'carga'],
  ['agachamento-corpo', 'Agachamento com peso corporal', 'quadriceps', 'corpo', 'corpo'],
  ['avanco-corpo', 'Avanço com peso corporal', 'quadriceps', 'corpo', 'corpo'],
  // Posteriores e glúteos
  ['stiff-barra', 'Stiff com barra', 'posteriores', 'barra', 'carga'],
  ['stiff-halter', 'Stiff com halteres', 'posteriores', 'halter', 'carga'],
  ['mesa-flexora', 'Mesa flexora', 'posteriores', 'maquina', 'carga'],
  ['cadeira-flexora', 'Cadeira flexora', 'posteriores', 'maquina', 'carga'],
  ['levantamento-terra', 'Levantamento terra', 'posteriores', 'barra', 'carga'],
  ['levantamento-terra-romeno', 'Levantamento terra romeno', 'posteriores', 'barra', 'carga'],
  ['good-morning', 'Good morning', 'posteriores', 'barra', 'carga'],
  ['hip-thrust', 'Hip thrust', 'gluteos', 'barra', 'carga'],
  ['elevacao-pelvica', 'Elevação pélvica', 'gluteos', 'corpo', 'corpo'],
  ['abducao-maquina', 'Abdução de quadril na máquina', 'gluteos', 'maquina', 'carga'],
  ['coice-cabo', 'Coice no cabo', 'gluteos', 'cabo', 'carga'],
  ['kettlebell-swing', 'Kettlebell swing', 'gluteos', 'kettlebell', 'carga'],
  // Panturrilha
  ['panturrilha-em-pe', 'Panturrilha em pé', 'panturrilha', 'maquina', 'carga'],
  ['panturrilha-sentado', 'Panturrilha sentado', 'panturrilha', 'maquina', 'carga'],
  // Core
  ['prancha', 'Prancha', 'core', 'corpo', 'tempo'],
  ['prancha-lateral', 'Prancha lateral', 'core', 'corpo', 'tempo'],
  ['abdominal-supra', 'Abdominal supra', 'core', 'corpo', 'corpo'],
  ['abdominal-remador', 'Abdominal remador', 'core', 'corpo', 'corpo'],
  ['elevacao-pernas', 'Elevação de pernas', 'core', 'corpo', 'corpo'],
  ['abdominal-cabo', 'Abdominal no cabo', 'core', 'cabo', 'carga'],
  ['roda-abdominal', 'Roda abdominal', 'core', 'outro', 'corpo'],
  ['russian-twist', 'Russian twist', 'core', 'halter', 'corpo'],
  ['dead-bug', 'Dead bug', 'core', 'corpo', 'corpo'],
  // Cardio e corpo inteiro
  ['burpee', 'Burpee', 'corpoInteiro', 'corpo', 'corpo'],
  ['thruster', 'Thruster', 'corpoInteiro', 'halter', 'carga'],
  ['clean-and-press', 'Clean and press', 'corpoInteiro', 'barra', 'carga'],
  ['corda-de-pular', 'Corda de pular', 'cardio', 'outro', 'tempo'],
  ['escalada-no-lugar', 'Escalada no lugar', 'cardio', 'corpo', 'tempo'],
  ['bicicleta-ergometrica', 'Bicicleta ergométrica', 'cardio', 'maquina', 'tempo'],
  ['esteira', 'Esteira', 'cardio', 'maquina', 'tempo'],
  ['remo-ergometro', 'Remo ergômetro', 'cardio', 'maquina', 'tempo'],
  ['elastico-afastamento', 'Afastamento com elástico', 'ombros', 'elastico', 'carga'],
];

export const BIBLIOTECA_EXERCICIOS: Exercicio[] = LINHAS.map(([id, nome, grupo, equipamento, tipo]) => ({
  id,
  nome,
  grupo,
  equipamento,
  tipo,
}));

export const EQUIPAMENTOS: Equipamento[] = [
  'peso-livre', 'barra', 'halter', 'maquina', 'cabo', 'kettlebell', 'elastico', 'corpo', 'outro',
];

export const GRUPOS: GrupoMuscular[] = [
  'peito', 'costas', 'ombros', 'biceps', 'triceps', 'antebraco', 'core',
  'quadriceps', 'posteriores', 'gluteos', 'panturrilha', 'cardio', 'corpoInteiro',
];
