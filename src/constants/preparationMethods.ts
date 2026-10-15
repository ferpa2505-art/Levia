export interface FormaPreparo {
  nome: string;
  kcalAdicional: number;
  proteinaGAdicional: number;
  /** de onde vêm as kcal extras: óleo vira gordura (9 kcal/g), empanado tem farinha */
  carboidratoGAdicional: number;
  gorduraGAdicional: number;
}

/**
 * Formas de preparo que podem ser somadas a um ingrediente no montador
 * de receitas (ex: "Batata" + "Fritura em imersão de óleo" = batata frita).
 * Os valores são um ADICIONAL fixo por porção usada na receita, não por
 * 100g — representam o óleo/empanado extra que entra na preparação.
 */
export const formasDePreparo: FormaPreparo[] = [
  { nome: 'Fritura em imersão de óleo', kcalAdicional: 150, proteinaGAdicional: 0, carboidratoGAdicional: 0, gorduraGAdicional: 16.7 },
  { nome: 'Refogado com pouco óleo/azeite', kcalAdicional: 45, proteinaGAdicional: 0, carboidratoGAdicional: 0, gorduraGAdicional: 5 },
  { nome: 'À milanesa / empanado', kcalAdicional: 120, proteinaGAdicional: 3, carboidratoGAdicional: 12, gorduraGAdicional: 6.7 },
  { nome: 'Grelhado na chapa sem gordura', kcalAdicional: 0, proteinaGAdicional: 0, carboidratoGAdicional: 0, gorduraGAdicional: 0 },
  { nome: 'Cozido apenas em água e sal', kcalAdicional: 0, proteinaGAdicional: 0, carboidratoGAdicional: 0, gorduraGAdicional: 0 },
  { nome: 'Assado no forno ao natural', kcalAdicional: 0, proteinaGAdicional: 0, carboidratoGAdicional: 0, gorduraGAdicional: 0 },
];

export function buscarFormasDePreparo(termo: string): FormaPreparo[] {
  const termoLimpo = termo.trim().toLowerCase();
  if (termoLimpo.length < 1) return formasDePreparo;
  return formasDePreparo.filter((f) => f.nome.toLowerCase().includes(termoLimpo));
}
