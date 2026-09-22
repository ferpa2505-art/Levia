import { Ingrediente } from '@models/ingredients';

/**
 * Banco de ingredientes isolados, sempre padronizados para valores
 * por 100g (kcalPor100g / proteinaGPor100g), pra deixar a soma de uma
 * receita personalizada sempre confiável, não importa a unidade
 * "natural" do ingrediente (fatia, colher, unidade, xícara...).
 *
 * `gramaPadrao` é só uma conveniência: quando o usuário escolhe o
 * ingrediente no montador de receitas, o campo de gramas já vem
 * preenchido com esse valor (ex: escolheu "Ovo" → já sugere 50g),
 * mas ele pode alterar livremente pro peso real que usou.
 */
export const ingredientes: Ingrediente[] = [
  // === CEREAIS, TUBÉRCULOS E MASSAS ===
  { nome: 'Arroz branco cozido', kcalPor100g: 130, proteinaGPor100g: 2.5, gramaPadrao: 100, unidadeComum: '100g (≈ 4 colheres de sopa)' },
  { nome: 'Arroz integral cozido', kcalPor100g: 120, proteinaGPor100g: 2.6, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Macarrão cozido espaguete', kcalPor100g: 158, proteinaGPor100g: 5.8, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Batata inglesa cozida', kcalPor100g: 86, proteinaGPor100g: 2, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Batata doce cozida', kcalPor100g: 86, proteinaGPor100g: 1.6, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Mandioca/Aipim cozido', kcalPor100g: 160, proteinaGPor100g: 1.3, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Inhame cozido', kcalPor100g: 118, proteinaGPor100g: 1.5, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Mandioquinha cozida', kcalPor100g: 110, proteinaGPor100g: 1.2, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Quinoa cozida', kcalPor100g: 120, proteinaGPor100g: 4.4, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Farinha de trigo', kcalPor100g: 364, proteinaGPor100g: 10, gramaPadrao: 100, unidadeComum: '100g' },

  // === LEGUMINOSAS ===
  { nome: 'Feijão carioca cozido', kcalPor100g: 76, proteinaGPor100g: 4.8, gramaPadrao: 100, unidadeComum: '100g (≈ 1 concha)' },
  { nome: 'Feijão preto cozido', kcalPor100g: 77, proteinaGPor100g: 5, gramaPadrao: 100, unidadeComum: '100g (≈ 1 concha)' },
  { nome: 'Lentilha cozida', kcalPor100g: 116, proteinaGPor100g: 9, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Grão de bico cozido', kcalPor100g: 164, proteinaGPor100g: 8.9, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Ervilha cozida', kcalPor100g: 81, proteinaGPor100g: 5.4, gramaPadrao: 100, unidadeComum: '100g' },

  // === CARNES, PEIXES E OVOS ===
  { nome: 'Peito de frango cozido/desfiado', kcalPor100g: 165, proteinaGPor100g: 31, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Patinho moído cozido', kcalPor100g: 220, proteinaGPor100g: 28, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Alcatra grelhada', kcalPor100g: 240, proteinaGPor100g: 32, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Contrafilé grelhado', kcalPor100g: 270, proteinaGPor100g: 29, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Filé de tilápia grelhado', kcalPor100g: 130, proteinaGPor100g: 26, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Posta de salmão grelhada', kcalPor100g: 210, proteinaGPor100g: 24, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Atum ralado em lata (ao natural)', kcalPor100g: 110, proteinaGPor100g: 23, gramaPadrao: 100, unidadeComum: '1 lata (≈100g)' },
  { nome: 'Atum ralado em lata (em óleo)', kcalPor100g: 170, proteinaGPor100g: 18, gramaPadrao: 100, unidadeComum: '1 lata (≈100g)' },
  { nome: 'Sardinha em lata', kcalPor100g: 210, proteinaGPor100g: 20, gramaPadrao: 100, unidadeComum: '1 lata (≈100g)' },
  { nome: 'Ovo (unidade)', kcalPor100g: 156, proteinaGPor100g: 12.6, gramaPadrao: 50, unidadeComum: '1 unidade (≈50g)' },
  { nome: 'Clara de ovo', kcalPor100g: 52, proteinaGPor100g: 10.9, gramaPadrao: 33, unidadeComum: 'clara de 1 ovo (≈33g)' },
  { nome: 'Gema de ovo', kcalPor100g: 323, proteinaGPor100g: 15.9, gramaPadrao: 17, unidadeComum: 'gema de 1 ovo (≈17g)' },

  // === VERDURAS E LEGUMES ===
  { nome: 'Brócolis cozido no vapor', kcalPor100g: 35, proteinaGPor100g: 2.8, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Couve-flor cozida', kcalPor100g: 25, proteinaGPor100g: 1.9, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Cenoura cozida', kcalPor100g: 35, proteinaGPor100g: 0.8, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Abóbora cabotiá cozida', kcalPor100g: 40, proteinaGPor100g: 1, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Chuchu cozido', kcalPor100g: 19, proteinaGPor100g: 0.6, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Abobrinha refogada', kcalPor100g: 24, proteinaGPor100g: 1.2, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Espinafre refogado', kcalPor100g: 40, proteinaGPor100g: 3, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Couve refogada', kcalPor100g: 70, proteinaGPor100g: 2.5, gramaPadrao: 100, unidadeComum: '100g' },
  { nome: 'Alface americana', kcalPor100g: 15, proteinaGPor100g: 1, gramaPadrao: 100, unidadeComum: '1 porção (≈100g)' },
  { nome: 'Tomate picado', kcalPor100g: 18, proteinaGPor100g: 0.8, gramaPadrao: 120, unidadeComum: '1 unidade média (≈120g)' },
  { nome: 'Cebola picada', kcalPor100g: 36, proteinaGPor100g: 1, gramaPadrao: 110, unidadeComum: '1 unidade média (≈110g)' },
  { nome: 'Alho triturado', kcalPor100g: 100, proteinaGPor100g: 4, gramaPadrao: 5, unidadeComum: '1 colher de chá (≈5g)' },

  // === FRUTAS ===
  { nome: 'Banana prata', kcalPor100g: 100, proteinaGPor100g: 1.4, gramaPadrao: 90, unidadeComum: '1 unidade média (≈90g)' },
  { nome: 'Maçã gala', kcalPor100g: 65, proteinaGPor100g: 0.2, gramaPadrao: 130, unidadeComum: '1 unidade média (≈130g)' },
  { nome: 'Abacate', kcalPor100g: 160, proteinaGPor100g: 2, gramaPadrao: 100, unidadeComum: 'meio abacate médio (≈100g)' },
  { nome: 'Morango', kcalPor100g: 21, proteinaGPor100g: 0.5, gramaPadrao: 150, unidadeComum: '1 xícara cheia (≈150g)' },
  { nome: 'Uva passas', kcalPor100g: 300, proteinaGPor100g: 3, gramaPadrao: 10, unidadeComum: '1 colher de sopa (≈10g)' },

  // === OLEAGINOSAS E GORDURAS ===
  { nome: 'Castanha do Pará', kcalPor100g: 660, proteinaGPor100g: 14, gramaPadrao: 5, unidadeComum: '1 unidade (≈5g)' },
  { nome: 'Amêndoas', kcalPor100g: 600, proteinaGPor100g: 21.3, gramaPadrao: 15, unidadeComum: '1 porção (≈15g)' },
  { nome: 'Pasta de amendoim integral', kcalPor100g: 600, proteinaGPor100g: 26.7, gramaPadrao: 15, unidadeComum: '1 colher de sopa (≈15g)' },
  { nome: 'Azeite de oliva', kcalPor100g: 923, proteinaGPor100g: 0, gramaPadrao: 13, unidadeComum: '1 colher de sopa (≈13g)' },
  { nome: 'Manteiga com sal', kcalPor100g: 714, proteinaGPor100g: 0.7, gramaPadrao: 14, unidadeComum: '1 colher de sopa (≈14g)' },

  // === LATICÍNIOS ===
  { nome: 'Queijo muçarela', kcalPor100g: 304, proteinaGPor100g: 21.4, gramaPadrao: 28, unidadeComum: '1 fatia (≈28g)' },
  { nome: 'Queijo prato', kcalPor100g: 360, proteinaGPor100g: 24.8, gramaPadrao: 25, unidadeComum: '1 fatia (≈25g)' },
  { nome: 'Queijo minas frescal', kcalPor100g: 233, proteinaGPor100g: 18.3, gramaPadrao: 30, unidadeComum: '1 fatia grossa (≈30g)' },
  { nome: 'Queijo cottage', kcalPor100g: 100, proteinaGPor100g: 12, gramaPadrao: 50, unidadeComum: '2 colheres de sopa (≈50g)' },
  { nome: 'Queijo tipo parmesão ralado', kcalPor100g: 430, proteinaGPor100g: 35, gramaPadrao: 10, unidadeComum: '1 colher de sopa ralado (≈10g)' },
  { nome: 'Requeijão cremoso', kcalPor100g: 300, proteinaGPor100g: 12.5, gramaPadrao: 20, unidadeComum: '1 colher de sopa (≈20g)' },
  { nome: 'Leite integral', kcalPor100g: 60, proteinaGPor100g: 3, gramaPadrao: 200, unidadeComum: '1 copo (≈200ml)' },
  { nome: 'Leite desnatado', kcalPor100g: 35, proteinaGPor100g: 3, gramaPadrao: 200, unidadeComum: '1 copo (≈200ml)' },

  // === PÃES E OUTROS ===
  { nome: 'Pão de forma tradicional', kcalPor100g: 280, proteinaGPor100g: 8.8, gramaPadrao: 25, unidadeComum: '1 fatia (≈25g)' },
  { nome: 'Pão de forma integral', kcalPor100g: 260, proteinaGPor100g: 12, gramaPadrao: 25, unidadeComum: '1 fatia (≈25g)' },
  { nome: 'Aveia em flocos', kcalPor100g: 385, proteinaGPor100g: 15.4, gramaPadrao: 13, unidadeComum: '1 colher de sopa (≈13g)' },
  { nome: 'Mel de abelha', kcalPor100g: 300, proteinaGPor100g: 0, gramaPadrao: 20, unidadeComum: '1 colher de sopa (≈20g)' },
];

export function buscarIngredientes(termo: string): Ingrediente[] {
  const termoLimpo = termo.trim().toLowerCase();
  if (termoLimpo.length < 2) return [];
  return ingredientes
    .filter((i) => i.nome.toLowerCase().includes(termoLimpo))
    .slice(0, 8);
}
