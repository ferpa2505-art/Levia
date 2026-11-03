import { diaNumero } from '@utils/tendenciaPeso';

/**
 * Dias seguidos (terminando hoje ou ontem) com pelo menos uma refeição registrada.
 * Se hoje ainda não tem refeição, a contagem segue de ontem: o dia ainda não acabou.
 */
export function diasSeguidos(datasComRefeicao: string[], hoje: string): number {
  const dias = new Set(datasComRefeicao.map(diaNumero));
  let dia = diaNumero(hoje);
  if (!dias.has(dia)) dia -= 1;
  let n = 0;
  while (dias.has(dia)) { n++; dia--; }
  return n;
}

/** Parte de cada macro nas calorias vindas de proteína (4), carboidrato (4) e gordura (9), em % */
export function partesDosMacros(proteinaG: number, carboidratoG: number, gorduraG: number) {
  const p = proteinaG * 4;
  const c = carboidratoG * 4;
  const g = gorduraG * 9;
  const total = p + c + g;
  if (total <= 0) return { proteina: 0, carboidrato: 0, gordura: 0 };
  return {
    proteina: Math.round((p / total) * 100),
    carboidrato: Math.round((c / total) * 100),
    gordura: Math.round((g / total) * 100),
  };
}
