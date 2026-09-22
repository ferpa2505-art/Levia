export interface ReceitaConhecida {
  nome: string;
  kcal: number;
  proteinaG: number;
}

/**
 * Lista local de pratos comuns, com valores médios por porção,
 * usada só como sugestão pra preencher o formulário mais rápido.
 * O usuário pode ajustar os valores depois de escolher.
 */
export const receitasConhecidas: ReceitaConhecida[] = [
  { nome: 'Arroz com feijão e frango grelhado', kcal: 520, proteinaG: 38 },
  { nome: 'Strogonoff de frango com arroz', kcal: 610, proteinaG: 32 },
  { nome: 'Omelete com 2 ovos', kcal: 220, proteinaG: 14 },
  { nome: 'Tapioca com queijo', kcal: 280, proteinaG: 9 },
  { nome: 'Pão francês com ovo', kcal: 260, proteinaG: 11 },
  { nome: 'Salada com frango grelhado', kcal: 320, proteinaG: 30 },
  { nome: 'Feijoada (porção média)', kcal: 680, proteinaG: 35 },
  { nome: 'Macarrão à bolonhesa', kcal: 590, proteinaG: 24 },
  { nome: 'Peixe grelhado com legumes', kcal: 340, proteinaG: 33 },
  { nome: 'Iogurte com granola e frutas', kcal: 250, proteinaG: 10 },
  { nome: 'Sanduíche natural de frango', kcal: 350, proteinaG: 22 },
  { nome: 'Sopa de legumes', kcal: 180, proteinaG: 6 },
  { nome: 'Panqueca de banana com aveia', kcal: 300, proteinaG: 12 },
  { nome: 'Carne moída com purê de batata', kcal: 540, proteinaG: 28 },
  { nome: 'Vitamina de frutas com leite', kcal: 240, proteinaG: 8 },
  { nome: 'Whey protein com água', kcal: 120, proteinaG: 24 },
  { nome: 'Ovos mexidos com pão integral', kcal: 300, proteinaG: 16 },
  { nome: 'Frango xadrez com arroz', kcal: 560, proteinaG: 30 },
  { nome: 'Salmão grelhado com quinoa', kcal: 420, proteinaG: 34 },
  { nome: 'Açaí com granola', kcal: 400, proteinaG: 6 },
];

export function buscarReceitas(termo: string): ReceitaConhecida[] {
  const termoLimpo = termo.trim().toLowerCase();
  if (termoLimpo.length < 2) return [];
  return receitasConhecidas
    .filter((r) => r.nome.toLowerCase().includes(termoLimpo))
    .slice(0, 5);
}
