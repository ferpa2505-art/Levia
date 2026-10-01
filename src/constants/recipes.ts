import { buscarPorNome } from '@utils/buscaAlimentos';

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

  // === PRATOS E REFEIÇÕES PRONTAS ===
  { nome: 'Escondidinho de carne seca', kcal: 480, proteinaG: 26 },
  { nome: 'Lasanha à bolonhesa', kcal: 650, proteinaG: 28 },
  { nome: 'Nhoque ao molho sugo', kcal: 410, proteinaG: 12 },
  { nome: 'Risoto de camarão', kcal: 490, proteinaG: 22 },
  { nome: 'Baião de dois', kcal: 550, proteinaG: 18 },
  { nome: 'Galinhada', kcal: 510, proteinaG: 29 },
  { nome: 'Cuscuz paulista', kcal: 320, proteinaG: 10 },
  { nome: 'Moqueca de peixe', kcal: 380, proteinaG: 24 },
  { nome: 'Bobó de camarão', kcal: 430, proteinaG: 20 },
  { nome: 'Bife a cavalo (com ovo frito)', kcal: 580, proteinaG: 42 },
  { nome: 'Bife à milanesa', kcal: 490, proteinaG: 32 },
  { nome: 'Frango a passarinho', kcal: 450, proteinaG: 28 },
  { nome: 'Yakissoba de carne e frango', kcal: 540, proteinaG: 26 },
  { nome: 'Sushi (combo 10 unidades variadas)', kcal: 350, proteinaG: 15 },
  { nome: 'Pizza de muçarela (1 fatia)', kcal: 280, proteinaG: 11 },
  { nome: 'Pizza de calabresa (1 fatia)', kcal: 310, proteinaG: 12 },
  { nome: 'Hambúrguer artesanal clássico', kcal: 550, proteinaG: 28 },
  { nome: 'Cheeseburger tradicional', kcal: 410, proteinaG: 20 },
  { nome: 'Hot dog completo', kcal: 420, proteinaG: 14 },
  { nome: 'Pastel de carne frito', kcal: 310, proteinaG: 9 },
  { nome: 'Coxinha de frango grande', kcal: 380, proteinaG: 12 },
  { nome: 'Pão de queijo médio', kcal: 135, proteinaG: 3 },
  { nome: 'Quiche de alho poró', kcal: 340, proteinaG: 8 },
  { nome: 'Caldo verde', kcal: 210, proteinaG: 9 },
  { nome: 'Caldo de feijão com torresmo', kcal: 320, proteinaG: 14 },
  { nome: 'Canja de galinha', kcal: 220, proteinaG: 15 },
  { nome: 'Sopa de lentilha', kcal: 240, proteinaG: 12 },
  { nome: 'Ceviche de peixe branco', kcal: 190, proteinaG: 22 },
  { nome: 'Carpaccio de carne com rúcula', kcal: 160, proteinaG: 14 },
  { nome: 'Tabule', kcal: 140, proteinaG: 4 },
  { nome: 'Quibe assado', kcal: 290, proteinaG: 19 },
  { nome: 'Guacamole com nachos (porção)', kcal: 390, proteinaG: 6 },
  { nome: 'Chili com carne', kcal: 410, proteinaG: 25 },
  { nome: 'Wrap de atum com maionese', kcal: 310, proteinaG: 19 },
  { nome: 'Crepioca de frango', kcal: 340, proteinaG: 26 },
];

export function buscarReceitas(termo: string): ReceitaConhecida[] {
  return buscarPorNome(receitasConhecidas, termo, (r) => r.nome, 4);
}
