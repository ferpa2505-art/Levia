import type { ChaveTraducao } from '@/i18n';
import type { Nutrientes } from '@models/ingredients';

type T = (chave: ChaveTraducao, params?: Record<string, string | number>) => string;

const num = (n: number) => String(Math.round(n * 10) / 10);

/**
 * "520 kcal · 38 g prot · 60 g carbo · 12 g gord · 8 g fibra".
 * Nutriente que falta (registro antigo) aparece como "–".
 */
export function textoNutrientes(t: T, n: Nutrientes): string {
  const g = (v: number | undefined, rotulo: ChaveTraducao) => `${v == null ? '–' : num(v)} g ${t(rotulo)}`;
  return [
    `${Math.round(n.kcal)} kcal`,
    g(n.proteinaG, 'nut.prot'),
    g(n.carboidratoG, 'nut.carb'),
    g(n.gorduraG, 'nut.gord'),
    g(n.fibraG, 'nut.fibra'),
  ].join(' · ');
}

/** Mesma linha para valores por 100 g de um alimento */
export function textoNutrientes100(
  t: T,
  a: { kcalPor100g: number; proteinaGPor100g: number; carboidratoGPor100g?: number; gorduraGPor100g?: number; fibraGPor100g?: number },
): string {
  return `${textoNutrientes(t, {
    kcal: a.kcalPor100g,
    proteinaG: a.proteinaGPor100g,
    carboidratoG: a.carboidratoGPor100g,
    gorduraG: a.gorduraGPor100g,
    fibraG: a.fibraGPor100g,
  })} ${t('nut.por100')}`;
}
