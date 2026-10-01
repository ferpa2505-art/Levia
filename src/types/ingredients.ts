export interface Ingrediente {
  nome: string;
  kcalPor100g: number;
  proteinaGPor100g: number;
  carboidratoGPor100g?: number;
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
  porcaoPadraoG?: number;
}

/** kcal e proteína de uma porção, em gramas */
export function valoresDaPorcao(receita: AlimentoPor100g, gramas: number) {
  return {
    kcal: Math.round((receita.kcalPor100g * gramas) / 100),
    proteinaG: Math.round((receita.proteinaGPor100g * gramas) / 100 * 10) / 10,
  };
}
