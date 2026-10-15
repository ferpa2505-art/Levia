import { RegistroPeso } from '@models/records';

/** Janela usada na tendência: só as últimas semanas (o ritmo muda ao longo do tratamento) */
export const JANELA_TENDENCIA_DIAS = 28;
/** Mínimo para mostrar tendência: 3 pesagens cobrindo pelo menos 7 dias */
const MIN_PONTOS = 3;
const MIN_DIAS = 7;
/** Previsão mais longa que isso não é mostrada como data */
const MAX_DIAS_PREVISAO = 3 * 365;
const DIA_MS = 24 * 3600 * 1000;

/** "AAAA-MM-DD" → dias desde 1970 (meio-dia local, imune a horário de verão) */
export function diaNumero(dataIso: string): number {
  const [a, m, d] = dataIso.split('-').map(Number);
  return Math.round(new Date(a, (m || 1) - 1, d || 1, 12).getTime() / DIA_MS);
}

export function dataDoDia(dia: number): Date {
  const d = new Date(dia * DIA_MS);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
}

export interface Tendencia {
  /** kg por dia (negativo = perdendo peso) */
  kgPorDia: number;
  /** reta: peso = a + kgPorDia × dia */
  a: number;
  /** primeiro e último dia usados no cálculo */
  diaInicio: number;
  diaFim: number;
}

export type Previsao =
  | { tipo: 'semDados' }
  | { tipo: 'semMeta' }
  | { tipo: 'naMeta' }
  /** peso parado ou indo para o lado contrário da meta */
  | { tipo: 'longe' }
  /** ritmo tão lento que a data passaria de 3 anos */
  | { tipo: 'muitoLonge' }
  | { tipo: 'data'; dia: number; semanas: number };

/** Regressão linear (mínimos quadrados) sobre as pesagens da janela recente */
export function calcularTendencia(pesos: RegistroPeso[], janelaDias = JANELA_TENDENCIA_DIAS): Tendencia | null {
  if (pesos.length < MIN_PONTOS) return null;
  const ordenados = [...pesos].sort((p, q) => (p.data < q.data ? -1 : 1));
  const ultimo = diaNumero(ordenados[ordenados.length - 1].data);
  const pontos = ordenados
    .map((p) => ({ x: diaNumero(p.data), y: p.pesoKg }))
    .filter((p) => p.x >= ultimo - janelaDias);
  if (pontos.length < MIN_PONTOS) return null;
  const diaInicio = pontos[0].x;
  if (ultimo - diaInicio < MIN_DIAS) return null;

  const n = pontos.length;
  const mx = pontos.reduce((s, p) => s + p.x, 0) / n;
  const my = pontos.reduce((s, p) => s + p.y, 0) / n;
  const sxx = pontos.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (sxx === 0) return null;
  const kgPorDia = pontos.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sxx;
  return { kgPorDia, a: my - kgPorDia * mx, diaInicio, diaFim: ultimo };
}

export function pesoNaReta(t: Tendencia, dia: number): number {
  return t.a + t.kgPorDia * dia;
}

/**
 * Quando a reta de tendência cruza a meta. É uma estimativa: a perda de peso
 * costuma desacelerar com o tempo, então a data real tende a ser mais tarde.
 */
export function preverMeta(tendencia: Tendencia | null, pesoAtual: number | null, meta: number | null): Previsao {
  if (meta == null) return { tipo: 'semMeta' };
  if (pesoAtual != null && Math.abs(pesoAtual - meta) < 0.25) return { tipo: 'naMeta' };
  if (!tendencia) return { tipo: 'semDados' };

  const hojeNaReta = pesoNaReta(tendencia, tendencia.diaFim);
  const falta = meta - hojeNaReta; // negativo = precisa perder
  // menos de ~50 g por semana na direção certa conta como "parado"
  const indoParaMeta = Math.sign(falta) === Math.sign(tendencia.kgPorDia) && Math.abs(tendencia.kgPorDia) >= 0.05 / 7;
  if (!indoParaMeta) return { tipo: 'longe' };

  // a folga evita que 79,0000001 (erro de ponto flutuante) vire 80 dias
  const dias = Math.ceil(falta / tendencia.kgPorDia - 1e-6);
  if (dias > MAX_DIAS_PREVISAO) return { tipo: 'muitoLonge' };
  return { tipo: 'data', dia: tendencia.diaFim + Math.max(0, dias), semanas: Math.max(1, Math.round(dias / 7)) };
}
