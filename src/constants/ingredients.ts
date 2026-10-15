import { Ingrediente } from '@models/ingredients';
import { alimentosGlobais, buscarAlimentosGlobais, buscarAlimentoPorId, idiomaAtualDosAlimentos } from '@constants/alimentosGlobais';
import { normalizarTexto } from '@utils/buscaAlimentos';

/**
 * Item curado: nome e porção caseira daqui, nutrientes do banco global
 * (TACO/CIQUAL/USDA) pelo id — assim os 5 nutrientes vêm sempre da mesma
 * fonte oficial e batem entre si.
 */
function curado(id: string, nome: string, gramaPadrao: number, unidadeComum: string): Ingrediente {
  const a = buscarAlimentoPorId(id, 'pt');
  if (!a) throw new Error(`Alimento ${id} não existe no banco global`);
  return {
    nome,
    kcalPor100g: a.kcalPor100g,
    proteinaGPor100g: a.proteinaGPor100g,
    carboidratoGPor100g: a.carboidratoGPor100g,
    gorduraGPor100g: a.gorduraGPor100g,
    fibraGPor100g: a.fibraGPor100g,
    gramaPadrao,
    unidadeComum,
  };
}

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
  curado('T3', 'Arroz branco cozido', 100, '100g (≈ 4 colheres de sopa)'),
  curado('T1', 'Arroz integral cozido', 100, '100g'),
  curado('U12756', 'Macarrão cozido espaguete', 100, '100g'),
  curado('T91', 'Batata inglesa cozida', 100, '100g'),
  curado('T88', 'Batata doce cozida', 100, '100g'),
  curado('T129', 'Mandioca/Aipim cozido', 100, '100g'),
  curado('C53503', 'Inhame cozido', 100, '100g'),
  curado('T86', 'Mandioquinha cozida', 100, '100g'),
  curado('C9341', 'Quinoa cozida', 100, '100g'),
  curado('T35', 'Farinha de trigo', 100, '100g'),

  // === LEGUMINOSAS ===
  curado('T561', 'Feijão carioca cozido', 100, '100g (≈ 1 concha)'),
  curado('T567', 'Feijão preto cozido', 100, '100g (≈ 1 concha)'),
  curado('T577', 'Lentilha cozida', 100, '100g'),
  curado('U17221', 'Grão de bico cozido', 100, '100g'),
  curado('C20326', 'Ervilha cozida', 100, '100g'),

  // === CARNES, PEIXES E OVOS ===
  curado('T408', 'Peito de frango cozido/desfiado', 100, '100g'),
  curado('T377', 'Patinho moído cozido', 100, '100g'),
  curado('T370', 'Alcatra grelhada', 100, '100g'),
  curado('T344', 'Contrafilé grelhado', 100, '100g'),
  curado('U18593', 'Filé de tilápia grelhado', 100, '100g'),
  curado('T315', 'Posta de salmão grelhada', 100, '100g'),
  curado('C26039', 'Atum ralado em lata (ao natural)', 100, '1 lata (≈100g)'),
  curado('C26180', 'Atum ralado em lata (em óleo)', 100, '1 lata (≈100g)'),
  curado('U18555', 'Sardinha em lata', 100, '1 lata (≈100g)'),
  curado('T488', 'Ovo (unidade)', 50, '1 unidade (≈50g)'),
  curado('T486', 'Clara de ovo', 33, 'clara de 1 ovo (≈33g)'),
  curado('T487', 'Gema de ovo', 17, 'gema de 1 ovo (≈17g)'),

  // === VERDURAS E LEGUMES ===
  curado('C20304', 'Brócolis cozido no vapor', 100, '100g'),
  curado('T118', 'Couve-flor cozida', 100, '100g'),
  curado('T109', 'Cenoura cozida', 100, '100g'),
  curado('T64', 'Abóbora cabotiá cozida', 100, '100g'),
  curado('T112', 'Chuchu cozido', 100, '100g'),
  curado('T72', 'Abobrinha refogada', 100, '100g'),
  curado('T120', 'Espinafre refogado', 100, '100g'),
  curado('T116', 'Couve refogada', 100, '100g'),
  curado('T77', 'Alface americana', 100, '1 porção (≈100g)'),
  curado('T157', 'Tomate picado', 120, '1 unidade média (≈120g)'),
  curado('T107', 'Cebola picada', 110, '1 unidade média (≈110g)'),
  curado('T82', 'Alho triturado', 5, '1 colher de chá (≈5g)'),

  // === FRUTAS ===
  curado('T182', 'Banana prata', 90, '1 unidade média (≈90g)'),
  curado('C13191', 'Maçã gala', 130, '1 unidade média (≈130g)'),
  curado('T163', 'Abacate', 100, 'meio abacate médio (≈100g)'),
  curado('T239', 'Morango', 150, '1 xícara cheia (≈150g)'),
  curado('C13046', 'Uva passas', 10, '1 colher de sopa (≈10g)'),

  // === OLEAGINOSAS E GORDURAS ===
  curado('T589', 'Castanha do Pará', 5, '1 unidade (≈5g)'),
  curado('U14294', 'Amêndoas', 15, '1 porção (≈15g)'),
  curado('U17716', 'Pasta de amendoim integral', 15, '1 colher de sopa (≈15g)'),
  curado('T260', 'Azeite de oliva', 13, '1 colher de sopa (≈13g)'),
  curado('T261', 'Manteiga com sal', 14, '1 colher de sopa (≈14g)'),

  // === LATICÍNIOS ===
  curado('T463', 'Queijo muçarela', 28, '1 fatia (≈28g)'),
  curado('T467', 'Queijo prato', 25, '1 fatia (≈25g)'),
  curado('T461', 'Queijo minas frescal', 30, '1 fatia grossa (≈30g)'),
  curado('E1961', 'Queijo cottage', 50, '2 colheres de sopa (≈50g)'),
  curado('T464', 'Queijo tipo parmesão ralado', 10, '1 colher de sopa ralado (≈10g)'),
  curado('T468', 'Requeijão cremoso', 20, '1 colher de sopa (≈20g)'),
  curado('T458', 'Leite integral', 200, '1 copo (≈200ml)'),
  curado('T457', 'Leite desnatado', 200, '1 copo (≈200ml)'),

  // === PÃES E OUTROS ===
  curado('C7200', 'Pão de forma tradicional', 25, '1 fatia (≈25g)'),
  curado('T52', 'Pão de forma integral', 25, '1 fatia (≈25g)'),
  curado('T7', 'Aveia em flocos', 13, '1 colher de sopa (≈13g)'),
  curado('T507', 'Mel de abelha', 20, '1 colher de sopa (≈20g)'),
];

/**
 * Lista curada (com porções caseiras) primeiro, depois o banco global de
 * alimentos e pratos prontos (TACO + CIQUAL + USDA + pratos montados, em
 * 5 idiomas — ver src/constants/alimentosGlobais.ts) sem repetir nomes.
 * `todosIngredientes` fica em português (usado pelo teste de busca).
 */
const nomesCurados = new Set(ingredientes.map((i) => normalizarTexto(i.nome)));
export const todosIngredientes: Ingrediente[] = [
  ...ingredientes,
  ...alimentosGlobais('pt').filter((a) => !nomesCurados.has(normalizarTexto(a.nome))),
];

/**
 * Busca no idioma escolhido no app. Em português a lista curada entra junto
 * (e ganha no empate); nos outros idiomas usa só o banco global traduzido.
 */
export function buscarIngredientes(termo: string, limite = 8): Ingrediente[] {
  const idioma = idiomaAtualDosAlimentos();
  return buscarAlimentosGlobais(termo, limite, idioma, idioma === 'pt' ? ingredientes : []);
}
