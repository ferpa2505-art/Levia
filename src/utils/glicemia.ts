import type { RegistroGlicemia } from '@models/diabetes';

/** 1 mmol/L de glicose ≈ 18 mg/dL */
export const FATOR_MMOL = 18;

/** Valor da medição sempre em mg/dL, para comparar e tirar média de registros em unidades diferentes */
export function valorMgDl(g: RegistroGlicemia): number {
  return g.unidade === 'mmol/L' ? Math.round(g.valor * FATOR_MMOL) : g.valor;
}

/** Momento da medição (data + horário locais) */
export function momentoGlicemia(g: RegistroGlicemia): Date {
  const [a, m, d] = g.data.split('-').map(Number);
  const [h, min] = (g.horario || '00:00').split(':').map(Number);
  return new Date(a, (m || 1) - 1, d || 1, h || 0, min || 0);
}

export function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return Math.round(valores.reduce((s, v) => s + v, 0) / valores.length);
}

/** Medições dos últimos `dias` dias (contando hoje), da mais antiga para a mais recente */
export function glicemiasDoPeriodo(glicemias: RegistroGlicemia[], dias: number): RegistroGlicemia[] {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - (dias - 1));
  return glicemias
    .filter((g) => momentoGlicemia(g) >= inicio)
    .sort((a, b) => momentoGlicemia(a).getTime() - momentoGlicemia(b).getTime());
}
