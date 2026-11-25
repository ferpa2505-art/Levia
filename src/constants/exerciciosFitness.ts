import type { Equipamento, Exercicio, GrupoMuscular, TipoExercicio } from '@/types/fitness';

/**
 * Biblioteca do Guia de Treinos. Nomes, grupos e equipamentos escritos pelo Leviã.
 * Formato compacto: [id, nome, grupo, equipamento, tipo]
 */
type Linha = [string, string, GrupoMuscular, Equipamento, TipoExercicio, GrupoMuscular[]];

const LINHAS: Linha[] = [
  // Adicionando gruposMusculares para exercícios de cardio e corpo inteiro
  ['corda-de-pular', 'Corda de pular', 'cardio', 'outro', 'tempo', ['core', 'quadriceps', 'panturrilha', 'cardio']],
  ['escalada-no-lugar', 'Escalada no lugar', 'cardio', 'corpo', 'tempo', ['core', 'ombros', 'posteriores', 'cardio']],
  ['bicicleta-ergometrica', 'Bicicleta ergométrica', 'cardio', 'maquina', 'tempo', ['quadriceps', 'posteriores', 'panturrilha', 'cardio']],
  ['esteira', 'Esteira', 'cardio', 'maquina', 'tempo', ['quadriceps', 'posteriores', 'panturrilha', 'core', 'cardio']],
  ['remo-ergometro', 'Remo ergômetro', 'cardio', 'maquina', 'tempo', ['costas', 'ombros', 'posteriores', 'core', 'cardio']],
  ['burpee', 'Burpee', 'corpoInteiro', 'corpo', 'corpo', ['peito', 'ombros', 'core', 'quadriceps', 'posteriores', 'panturrilha', 'gluteos', 'corpoInteiro']],
  ['thruster', 'Thruster', 'corpoInteiro', 'halter', 'carga', ['peito', 'ombros', 'core', 'quadriceps', 'posteriores', 'corpoInteiro']],
  ['clean-and-press', 'Clean and press', 'corpoInteiro', 'barra', 'carga', ['ombros', 'posteriores', 'core', 'quadriceps', 'corpoInteiro']],
  // Peito
  ['supino-reto-barra', 'Supino reto com barra', 'peito', 'barra', 'carga', ['peito']],
  ['supino-inclinado-barra', 'Supino inclinado com barra', 'peito', 'barra', 'carga', ['peito']],
  ['supino-reto-halter', 'Supino reto com halteres', 'peito', 'halter', 'carga', ['peito']],
  ['supino-inclinado-halter', 'Supino inclinado com halteres', 'peito', 'halter', 'carga', ['peito']],
  ['supino-maquina', 'Supino na máquina', 'peito', 'maquina', 'carga', ['peito']],
  ['crucifixo-halter', 'Crucifixo com halteres', 'peito', 'halter', 'carga', ['peito']],
  ['crucifixo-cabo', 'Crucifixo no cabo', 'peito', 'cabo', 'carga', ['peito']],
  ['peck-deck', 'Voador (peck deck)', 'peito', 'maquina', 'carga', ['peito']],
  ['flexao-bracos', 'Flexão de braço', 'peito', 'corpo', 'corpo', ['peito', 'triceps', 'ombros']],
  ['mergulho-paralelas', 'Mergulho nas paralelas', 'peito', 'corpo', 'corpo', ['peito', 'triceps', 'ombros']],
  // Costas
  ['barra-fixa', 'Barra fixa', 'costas', 'corpo', 'corpo', ['costas', 'biceps']],
  ['puxada-frontal', 'Puxada frontal', 'costas', 'cabo', 'carga', ['costas', 'biceps']],
  ['puxada-triangulo', 'Puxada triângulo', 'costas', 'cabo', 'carga', ['costas', 'biceps']],
  ['remada-curvada-barra', 'Remada curvada com barra', 'costas', 'barra', 'carga', ['costas', 'biceps', 'posteriores']],
  ['remada-serrote', 'Remada serrote', 'costas', 'halter', 'carga', ['costas', 'biceps']],
  ['remada-baixa-cabo', 'Remada baixa no cabo', 'costas', 'cabo', 'carga', ['costas', 'biceps']],
  ['remada-maquina', 'Remada na máquina', 'costas', 'maquina', 'carga', ['costas', 'biceps']],
  ['pulldown-barra', 'Pulldown com corda', 'costas', 'cabo', 'carga', ['costas', 'biceps']],
  ['hiperextensao', 'Hiperextensão lombar', 'costas', 'corpo', 'corpo', ['costas', 'gluteos', 'posteriores']],
  ['encolhimento-halter', 'Encolhimento com halteres', 'costas', 'halter', 'carga', ['costas']],
  // Ombros
  ['desenvolvimento-barra', 'Desenvolvimento com barra', 'ombros', 'barra', 'carga', ['ombros', 'triceps']],
  ['desenvolvimento-halter', 'Desenvolvimento com halteres', 'ombros', 'halter', 'carga', ['ombros', 'triceps']],
  ['desenvolvimento-maquina', 'Desenvolvimento na máquina', 'ombros', 'maquina', 'carga', ['ombros', 'triceps']],
  ['elevacao-lateral-halter', 'Elevação lateral com halteres', 'ombros', 'halter', 'carga', ['ombros']],
  ['elevacao-lateral-cabo', 'Elevação lateral no cabo', 'ombros', 'cabo', 'carga', ['ombros']],
  ['elevacao-frontal', 'Elevação frontal', 'ombros', 'halter', 'carga', ['ombros']],
  ['crucifixo-invertido', 'Crucifixo invertido', 'ombros', 'halter', 'carga', ['ombros', 'costas']],
  ['face-pull', 'Face pull', 'ombros', 'cabo', 'carga', ['ombros', 'costas']],
  ['arnold-press', 'Arnold press', 'ombros', 'halter', 'carga', ['ombros', 'triceps']],
  // Bíceps
  ['rosca-direta-barra', 'Rosca direta com barra', 'biceps', 'barra', 'carga', ['biceps']],
  ['rosca-alternada-halter', 'Rosca alternada com halteres', 'biceps', 'halter', 'carga', ['biceps']],
  ['rosca-martelo', 'Rosca martelo', 'biceps', 'halter', 'carga', ['biceps', 'antebraco']],
  ['rosca-scott', 'Rosca Scott', 'biceps', 'maquina', 'carga', ['biceps']],
  ['rosca-cabo', 'Rosca no cabo', 'biceps', 'cabo', 'carga', ['biceps']],
  ['rosca-concentrada', 'Rosca concentrada', 'biceps', 'halter', 'carga', ['biceps']],
  // Tríceps
  ['triceps-polia-corda', 'Tríceps na polia com corda', 'triceps', 'cabo', 'carga', ['triceps']],
  ['triceps-polia-barra', 'Tríceps na polia com barra', 'triceps', 'cabo', 'carga', ['triceps']],
  ['triceps-testa', 'Tríceps testa', 'triceps', 'barra', 'carga', ['triceps']],
  ['triceps-frances', 'Tríceps francês com halter', 'triceps', 'halter', 'carga', ['triceps']],
  ['triceps-coice', 'Tríceps coice', 'triceps', 'halter', 'carga', ['triceps']],
  ['mergulho-banco', 'Mergulho no banco', 'triceps', 'corpo', 'corpo', ['triceps', 'peito', 'ombros']],
  ['supino-fechado', 'Supino fechado', 'triceps', 'barra', 'carga', ['triceps', 'peito']],
  // Antebraço
  ['rosca-punho', 'Rosca de punho', 'antebraco', 'halter', 'carga', ['antebraco']],
  ['rosca-punho-inversa', 'Rosca de punho inversa', 'antebraco', 'barra', 'carga', ['antebraco']],
  ['farmer-carry', 'Caminhada do fazendeiro', 'antebraco', 'halter', 'carga', ['antebraco', 'core', 'posteriores']],
  // Quadríceps
  ['agachamento-livre', 'Agachamento livre', 'quadriceps', 'barra', 'carga', ['quadriceps', 'gluteos', 'core']],
  ['agachamento-frontal', 'Agachamento frontal', 'quadriceps', 'barra', 'carga', ['quadriceps', 'gluteos', 'core']],
  ['agachamento-goblet', 'Agachamento goblet', 'quadriceps', 'kettlebell', 'carga', ['quadriceps', 'gluteos', 'core']],
  ['leg-press', 'Leg press 45°', 'quadriceps', 'maquina', 'carga', ['quadriceps', 'gluteos']],
  ['cadeira-extensora', 'Cadeira extensora', 'quadriceps', 'maquina', 'carga', ['quadriceps']],
  ['afundo', 'Afundo', 'quadriceps', 'halter', 'carga', ['quadriceps', 'gluteos']],
  ['agachamento-bulgaro', 'Agachamento búlgaro', 'quadriceps', 'halter', 'carga', ['quadriceps', 'gluteos']],
  ['agachamento-corpo', 'Agachamento com peso corporal', 'quadriceps', 'corpo', 'corpo', ['quadriceps', 'gluteos']],
  ['avanco-corpo', 'Avanço com peso corporal', 'quadriceps', 'corpo', 'corpo', ['quadriceps', 'gluteos']],
  // Posteriores e glúteos
  ['stiff-barra', 'Stiff com barra', 'posteriores', 'barra', 'carga', ['posteriores', 'gluteos']],
  ['stiff-halter', 'Stiff com halteres', 'posteriores', 'halter', 'carga', ['posteriores', 'gluteos']],
  ['mesa-flexora', 'Mesa flexora', 'posteriores', 'maquina', 'carga', ['posteriores']],
  ['cadeira-flexora', 'Cadeira flexora', 'posteriores', 'maquina', 'carga', ['posteriores']],
  ['levantamento-terra', 'Levantamento terra', 'posteriores', 'barra', 'carga', ['posteriores', 'gluteos', 'costas', 'core']],
  ['levantamento-terra-romeno', 'Levantamento terra romeno', 'posteriores', 'barra', 'carga', ['posteriores', 'gluteos']],
  ['good-morning', 'Good morning', 'posteriores', 'barra', 'carga', ['posteriores', 'gluteos', 'costas']],
  ['hip-thrust', 'Hip thrust', 'gluteos', 'barra', 'carga', ['gluteos', 'posteriores']],
  ['elevacao-pelvica', 'Elevação pélvica', 'gluteos', 'corpo', 'corpo', ['gluteos', 'posteriores']],
  ['abducao-maquina', 'Abdução de quadril na máquina', 'gluteos', 'maquina', 'carga', ['gluteos']],
  ['coice-cabo', 'Coice no cabo', 'gluteos', 'cabo', 'carga', ['gluteos']],
  ['kettlebell-swing', 'Kettlebell swing', 'gluteos', 'kettlebell', 'carga', ['gluteos', 'posteriores', 'core']],
  // Panturrilha
  ['panturrilha-em-pe', 'Panturrilha em pé', 'panturrilha', 'maquina', 'carga', ['panturrilha']],
  ['panturrilha-sentado', 'Panturrilha sentado', 'panturrilha', 'maquina', 'carga', ['panturrilha']],
  // Core
  ['prancha', 'Prancha', 'core', 'corpo', 'tempo', ['core']],
  ['prancha-lateral', 'Prancha lateral', 'core', 'corpo', 'tempo', ['core']],
  ['abdominal-supra', 'Abdominal supra', 'core', 'corpo', 'corpo', ['core']],
  ['abdominal-remador', 'Abdominal remador', 'core', 'corpo', 'corpo', ['core']],
  ['elevacao-pernas', 'Elevação de pernas', 'core', 'corpo', 'corpo', ['core']],
  ['abdominal-cabo', 'Abdominal no cabo', 'core', 'cabo', 'carga', ['core']],
  ['roda-abdominal', 'Roda abdominal', 'core', 'outro', 'corpo', ['core']],
  ['russian-twist', 'Russian twist', 'core', 'halter', 'corpo', ['core']],
  ['dead-bug', 'Dead bug', 'core', 'corpo', 'corpo', ['core']],
  // Cardio e corpo inteiro
  ['burpee', 'Burpee', 'corpoInteiro', 'corpo', 'corpo', ['peito', 'ombros', 'core', 'quadriceps', 'posteriores', 'panturrilha', 'gluteos', 'corpoInteiro']],
  ['thruster', 'Thruster', 'corpoInteiro', 'halter', 'carga', ['peito', 'ombros', 'core', 'quadriceps', 'posteriores', 'corpoInteiro']],
  ['clean-and-press', 'Clean and press', 'corpoInteiro', 'barra', 'carga', ['ombros', 'posteriores', 'core', 'quadriceps', 'corpoInteiro']],
  ['corda-de-pular', 'Corda de pular', 'cardio', 'outro', 'tempo', ['core', 'quadriceps', 'panturrilha', 'cardio']],
  ['escalada-no-lugar', 'Escalada no lugar', 'cardio', 'corpo', 'tempo', ['core', 'ombros', 'posteriores', 'cardio']],
  ['bicicleta-ergometrica', 'Bicicleta ergométrica', 'cardio', 'maquina', 'tempo', ['quadriceps', 'posteriores', 'panturrilha', 'cardio']],
  ['esteira', 'Esteira', 'cardio', 'maquina', 'tempo', ['quadriceps', 'posteriores', 'panturrilha', 'core', 'cardio']],
  ['remo-ergometro', 'Remo ergômetro', 'cardio', 'maquina', 'tempo', ['costas', 'ombros', 'posteriores', 'core', 'cardio']],
  ['elastico-afastamento', 'Afastamento com elástico', 'ombros', 'elastico', 'carga', ['ombros']],
];

export const BIBLIOTECA_EXERCICIOS: Exercicio[] = LINHAS.map(([id, nome, grupo, equipamento, tipo, gruposMusculares]) => ({
  id,
  nome,
  grupo,
  equipamento,
  tipo,
  gruposMusculares,
}));

export const EQUIPAMENTOS: Equipamento[] = [
  'peso-livre', 'barra', 'halter', 'maquina', 'cabo', 'kettlebell', 'elastico', 'corpo', 'outro',
];

export const GRUPOS: GrupoMuscular[] = [
  'peito', 'costas', 'ombros', 'biceps', 'triceps', 'antebraco', 'core',
  'quadriceps', 'posteriores', 'gluteos', 'panturrilha', 'cardio', 'corpoInteiro',
];
