export interface Exercicio {
  nome: string;
  kcalPorMinuto: number;
  categoria: 'Cardio' | 'Força' | 'Flexibilidade e bem-estar' | 'Esportes';
}

/**
 * Estimativas de gasto calórico por minuto, pensadas pra uma pessoa
 * adulta média (~70kg). São só uma referência inicial: o usuário
 * sempre pode ajustar o valor de kcal depois de escolher, ou registrar
 * uma atividade livre que não está na lista.
 */
export const exercicios: Exercicio[] = [
  // === CARDIO ===
  { nome: 'Caminhada leve', kcalPorMinuto: 4, categoria: 'Cardio' },
  { nome: 'Caminhada rápida', kcalPorMinuto: 6, categoria: 'Cardio' },
  { nome: 'Corrida leve', kcalPorMinuto: 8, categoria: 'Cardio' },
  { nome: 'Corrida moderada', kcalPorMinuto: 11, categoria: 'Cardio' },
  { nome: 'Corrida forte', kcalPorMinuto: 14, categoria: 'Cardio' },
  { nome: 'Ciclismo leve', kcalPorMinuto: 6, categoria: 'Cardio' },
  { nome: 'Ciclismo moderado', kcalPorMinuto: 8, categoria: 'Cardio' },
  { nome: 'Natação leve', kcalPorMinuto: 7, categoria: 'Cardio' },
  { nome: 'Natação vigorosa', kcalPorMinuto: 10, categoria: 'Cardio' },
  { nome: 'Pular corda', kcalPorMinuto: 12, categoria: 'Cardio' },
  { nome: 'Subir escadas', kcalPorMinuto: 9, categoria: 'Cardio' },
  { nome: 'Elíptico', kcalPorMinuto: 7, categoria: 'Cardio' },

  // === FORÇA ===
  { nome: 'Musculação (treino de força)', kcalPorMinuto: 6, categoria: 'Força' },
  { nome: 'Treino funcional', kcalPorMinuto: 9, categoria: 'Força' },
  { nome: 'HIIT (alta intensidade)', kcalPorMinuto: 12, categoria: 'Força' },
  { nome: 'Crossfit', kcalPorMinuto: 11, categoria: 'Força' },

  // === FLEXIBILIDADE E BEM-ESTAR ===
  { nome: 'Yoga', kcalPorMinuto: 3, categoria: 'Flexibilidade e bem-estar' },
  { nome: 'Pilates', kcalPorMinuto: 4, categoria: 'Flexibilidade e bem-estar' },
  { nome: 'Alongamento', kcalPorMinuto: 2.5, categoria: 'Flexibilidade e bem-estar' },

  // === ESPORTES ===
  { nome: 'Dança (zumba e similares)', kcalPorMinuto: 7, categoria: 'Esportes' },
  { nome: 'Futebol recreativo', kcalPorMinuto: 9, categoria: 'Esportes' },
  { nome: 'Vôlei', kcalPorMinuto: 4, categoria: 'Esportes' },
  { nome: 'Basquete', kcalPorMinuto: 8, categoria: 'Esportes' },
  { nome: 'Tênis', kcalPorMinuto: 7, categoria: 'Esportes' },
];

export function buscarExercicios(termo: string): Exercicio[] {
  const termoLimpo = termo.trim().toLowerCase();
  if (termoLimpo.length < 2) return [];
  return exercicios
    .filter((e) => e.nome.toLowerCase().includes(termoLimpo))
    .slice(0, 8);
}
