import { Refeicao, RegistroAgua, RegistroPeso, TipoRefeicao } from '@models/records';
import type { RegistroGlicemia } from '@models/diabetes';
import { valorMgDl } from '@utils/glicemia';

/**
 * Cálculos do gráfico de alimentação: junta refeições, água, pesagens e
 * glicemias por dia, semana ou mês e mede quanto cada nutriente andou junto
 * com o peso e a glicemia. É só associação estatística, não causa.
 */

export const METRICAS = ['kcal', 'carboidratoG', 'proteinaG', 'fibraG', 'gorduraG', 'aguaMl'] as const;
export type Metrica = (typeof METRICAS)[number];
export type Agrupamento = 'dia' | 'semana' | 'mes';

export interface Balde {
  /** AAAA-MM-DD do primeiro dia do grupo */
  inicio: string;
  fim: string;
  /** Média por dia com registro (nutrientes e água); null se não houve registro */
  valores: Record<Metrica, number | null>;
  /** Última pesagem do grupo */
  pesoKg: number | null;
  /** Média das medições do grupo, em mg/dL */
  glicemiaMgDl: number | null;
}

export function isoDe(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dataDeIso(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, (m || 1) - 1, d || 1);
}

export function somarDias(iso: string, n: number): string {
  const d = dataDeIso(iso);
  d.setDate(d.getDate() + n);
  return isoDe(d);
}

/** Início do grupo a que o dia pertence (semana começa na segunda) */
export function inicioDoGrupo(iso: string, ag: Agrupamento): string {
  if (ag === 'dia') return iso;
  if (ag === 'mes') return `${iso.slice(0, 7)}-01`;
  const d = dataDeIso(iso);
  const desdeSegunda = (d.getDay() + 6) % 7;
  return somarDias(iso, -desdeSegunda);
}

/** Agrupamento que deixa o gráfico legível para o tamanho do período */
export function agrupamentoSugerido(dias: number): Agrupamento {
  if (dias <= 31) return 'dia';
  if (dias <= 120) return 'semana';
  return 'mes';
}

const media = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null);
const umaCasa = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10);

export interface EntradaSerie {
  refeicoes: Refeicao[];
  aguas: RegistroAgua[];
  pesos: RegistroPeso[];
  glicemias: RegistroGlicemia[];
  inicio: string;
  fim: string;
  agrupamento: Agrupamento;
  /** null = todas as refeições */
  tipos: TipoRefeicao[] | null;
}

export function montarSerie(e: EntradaSerie): Balde[] {
  const refs = e.refeicoes.filter((r) => r.data >= e.inicio && r.data <= e.fim && (!e.tipos || e.tipos.includes(r.tipo ?? 'outro')));
  const grupos = new Map<string, string[]>();
  for (let d = e.inicio; d <= e.fim; d = somarDias(d, 1)) {
    const g = inicioDoGrupo(d, e.agrupamento);
    grupos.set(g, [...(grupos.get(g) ?? []), d]);
  }
  return [...grupos.entries()].map(([inicio, dias]) => {
    const noGrupo = new Set(dias);
    const diasComRefeicao = dias.filter((d) => refs.some((r) => r.data === d));
    const porDia = (f: (r: Refeicao) => number | undefined) =>
      diasComRefeicao.length
        ? umaCasa(media(diasComRefeicao.map((d) => refs.filter((r) => r.data === d).reduce((s, r) => s + (f(r) ?? 0), 0))))
        : null;
    const aguaPorDia = dias.map((d) => e.aguas.filter((a) => a.data === d).reduce((s, a) => s + a.ml, 0)).filter((ml) => ml > 0);
    const pesos = e.pesos.filter((p) => noGrupo.has(p.data)).sort((a, b) => a.data.localeCompare(b.data));
    const glic = e.glicemias.filter((g) => noGrupo.has(g.data)).map(valorMgDl);
    return {
      inicio,
      fim: dias[dias.length - 1],
      valores: {
        kcal: porDia((r) => r.kcal),
        carboidratoG: porDia((r) => r.carboidratoG),
        proteinaG: porDia((r) => r.proteinaG),
        fibraG: porDia((r) => r.fibraG),
        gorduraG: porDia((r) => r.gorduraG),
        aguaMl: aguaPorDia.length ? Math.round(media(aguaPorDia)!) : null,
      },
      pesoKg: pesos.length ? pesos[pesos.length - 1].pesoKg : null,
      glicemiaMgDl: glic.length ? Math.round(media(glic)!) : null,
    };
  });
}

/** Correlação de Pearson entre pares em que os dois lados existem */
export function correlacao(pares: [number | null, number | null][]): { r: number; n: number } | null {
  const ok = pares.filter((p): p is [number, number] => p[0] != null && p[1] != null);
  if (ok.length < 4) return null;
  const mx = media(ok.map((p) => p[0]))!;
  const my = media(ok.map((p) => p[1]))!;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const [x, y] of ok) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  if (sxx === 0 || syy === 0) return null;
  return { r: Math.round((sxy / Math.sqrt(sxx * syy)) * 100) / 100, n: ok.length };
}

export interface Influencia {
  metrica: Metrica;
  /** nutriente do grupo × glicemia média do mesmo grupo */
  glicemia: { r: number; n: number } | null;
  /** nutriente do grupo × variação até a próxima pesagem */
  peso: { r: number; n: number } | null;
}

export function calcularInfluencias(baldes: Balde[], metricas: readonly Metrica[]): Influencia[] {
  // variação de peso: da pesagem deste grupo até a próxima pesagem registrada
  const variacaoPeso = baldes.map((b, i) => {
    if (b.pesoKg == null) return null;
    const prox = baldes.slice(i + 1).find((x) => x.pesoKg != null);
    return prox ? prox.pesoKg! - b.pesoKg : null;
  });
  return metricas.map((m) => ({
    metrica: m,
    glicemia: correlacao(baldes.map((b) => [b.valores[m], b.glicemiaMgDl])),
    peso: correlacao(baldes.map((b, i) => [b.valores[m], variacaoPeso[i]])),
  }));
}

/** 'fraca' | 'moderada' | 'forte', pelo tamanho de r */
export function forcaDaRelacao(r: number): 'fraca' | 'moderada' | 'forte' {
  const a = Math.abs(r);
  return a < 0.3 ? 'fraca' : a < 0.6 ? 'moderada' : 'forte';
}
