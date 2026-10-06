export interface Ingrediente {
  nome: string;
  kcalPor100g: number;
  proteinaGPor100g: number;
  carboidratoGPor100g?: number;
  gorduraGPor100g?: number;
  fibraGPor100g?: number;
  /** Quantidade em gramas que preenche o campo por padrão (ex: 1 ovo ≈ 50g) */
  gramaPadrao: number;
  /** Rótulo da unidade comum, só pra ajudar visualmente (ex: "1 unidade", "1 colher de sopa") */
  unidadeComum?: string;
}

export interface IngredienteUsado {
  ingredienteNome: string;
  gramas: number;
  /** Nome da forma de preparo aplicada a este item, se houver (ex: "Fritura em imersão de óleo") */
  formaPreparoNome?: string;
  /** kcal já somando gramas × kcalPor100g/100 + eventual adicional da forma de preparo */
  kcal: number;
  /** proteína já somando gramas × proteinaGPor100g/100 + eventual adicional da forma de preparo */
  proteinaG: number;
  carboidratoG?: number;
  gorduraG?: number;
  fibraG?: number;
}

export interface ReceitaPersonalizada {
  id: string;
  nome: string;
  ingredientes: IngredienteUsado[];
  pesoTotalG: number;
  kcalTotal: number;
  proteinaGTotal: number;
  kcalPor100g: number;
  proteinaGPor100g: number;
  carboidratoGPor100g?: number;
  gorduraGPor100g?: number;
  fibraGPor100g?: number;
  /** Quantidade sugerida ao registrar a receita no Diário (padrão 100 g) */
  porcaoPadraoG?: number;
  criadaEm: string;
}

export const PORCAO_PADRAO_G = 100;

/** Qualquer coisa com valores por 100 g: receita salva ou alimento do banco */
export interface AlimentoPor100g {
  nome: string;
  kcalPor100g: number;
  proteinaGPor100g: number;
  carboidratoGPor100g?: number;
  gorduraGPor100g?: number;
  fibraGPor100g?: number;
  porcaoPadraoG?: number;
}

/** Os 5 nutrientes que o app acompanha. Carboidrato, gordura e fibra podem faltar em registros antigos. */
export interface Nutrientes {
  kcal: number;
  proteinaG: number;
  carboidratoG?: number;
  gorduraG?: number;
  fibraG?: number;
}

const umaCasa = (n: number) => Math.round(n * 10) / 10;
const daPorcao = (por100: number | undefined, gramas: number) => (por100 == null ? undefined : umaCasa((por100 * gramas) / 100));

/** Nutrientes de uma porção, em gramas */
export function valoresDaPorcao(alimento: AlimentoPor100g, gramas: number): Nutrientes & { kcal: number; proteinaG: number } {
  return {
    kcal: Math.round((alimento.kcalPor100g * gramas) / 100),
    proteinaG: umaCasa((alimento.proteinaGPor100g * gramas) / 100),
    carboidratoG: daPorcao(alimento.carboidratoGPor100g, gramas),
    gorduraG: daPorcao(alimento.gorduraGPor100g, gramas),
    fibraG: daPorcao(alimento.fibraGPor100g, gramas),
  };
}

/** Soma os nutrientes; um campo opcional só aparece no total se algum item o tiver. */
export function somarNutrientes(lista: Nutrientes[]): Required<Pick<Nutrientes, 'kcal' | 'proteinaG'>> & Nutrientes {
  const soma = (f: (n: Nutrientes) => number | undefined) =>
    lista.some((n) => f(n) != null) ? umaCasa(lista.reduce((s, n) => s + (f(n) ?? 0), 0)) : undefined;
  return {
    kcal: Math.round(lista.reduce((s, n) => s + n.kcal, 0)),
    proteinaG: umaCasa(lista.reduce((s, n) => s + n.proteinaG, 0)),
    carboidratoG: soma((n) => n.carboidratoG),
    gorduraG: soma((n) => n.gorduraG),
    fibraG: soma((n) => n.fibraG),
  };
}
