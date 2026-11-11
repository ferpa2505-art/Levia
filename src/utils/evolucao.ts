import type { Refeicao, RegistroAgua, RegistroPeso, RegistroExercicio } from '@models/records';
import type { RegistroGlicemia, RegistroMedicacao } from '@models/diabetes';
import type { RegistroDoseGLP1 } from '@models/glp1';
import { diaNumero, dataDoDia } from '@utils/tendenciaPeso';
import { valorMgDl } from '@utils/glicemia';

/**
 * Evolução: junta o que a pessoa comeu, mediu e tomou num período e compara com o período anterior.
 * Só mostra os números do próprio usuário lado a lado; não interpreta nem sugere nada.
 */
export type PeriodoEvolucao = 'dia' | 'semana' | 'mes' | 'inicio';

export interface DadosEvolucao {
  refeicoes: Refeicao[];
  aguas: RegistroAgua[];
  pesos: RegistroPeso[];
  exercicios: RegistroExercicio[];
  glicemias: RegistroGlicemia[];
  dosesGlp1: RegistroDoseGLP1[];
  medicacoes: RegistroMedicacao[];
  alvoGlicemia: { min: number; max: number };
  /** treinos do Guia de Treinos já convertidos em kcal estimadas (opcional) */
  treinosGuia?: { data: string; kcal: number; minutos: number }[];
}

export interface ResumoGlicemia {
  medicoes: number;
  mediaMgDl: number | null;
  minimoMgDl: number | null;
  maximoMgDl: number | null;
  /** % das medições dentro da faixa-alvo */
  noAlvoPct: number | null;
}

export interface ResumoPeriodo {
  /** dias do período */
  dias: number;
  /** dias com pelo menos uma refeição registrada */
  diasComRefeicao: number;
  refeicoes: number;
  /** médias por dia COM registro (dia sem registro não puxa a média para baixo) */
  kcalMediaDia: number | null;
  /** gasto médio por dia com atividade (exercícios + treinos do Guia) */
  kcalGastaMediaDia: number | null;
  /** saldo médio por dia com atividade: kcal ingeridas − kcal gastas */
  kcalSaldoMediaDia: number | null;
  proteinaMediaDiaG: number | null;
  carboidratoMediaDiaG: number | null;
  gorduraMediaDiaG: number | null;
  fibraMediaDiaG: number | null;
  aguaMediaDiaMl: number | null;
  exercicioMin: number;
  exercicioKcal: number;
  pesoInicialKg: number | null;
  pesoFinalKg: number | null;
  /** final − inicial (null com menos de 2 pesagens no período) */
  pesoVariacaoKg: number | null;
  glicemia: ResumoGlicemia;
  dosesGlp1: number;
  medicacoesRegistradas: number;
}

export interface Barra {
  /** primeiro e último dia (AAAA-MM-DD) que a barra cobre */
  de: string;
  ate: string;
  /** média de kcal por dia com registro dentro da barra (0 se não houve registro) */
  kcal: number;
  proteinaG: number;
}

export interface PontoPeso {
  data: string;
  pesoKg: number;
}

export interface Evolucao {
  periodo: PeriodoEvolucao;
  de: string;
  ate: string;
  atual: ResumoPeriodo;
  /** período de mesmo tamanho logo antes; null em "desde o início" */
  anterior: ResumoPeriodo | null;
  barras: Barra[];
  pesos: PontoPeso[];
  /** true quando não há nenhum registro de nada no período */
  vazio: boolean;
}

const iso = (dia: number) => {
  const d = dataDoDia(dia);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const arredonda = (n: number, casas = 0) => {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
};

const mediaOuNull = (soma: number, n: number, casas = 0) => (n > 0 ? arredonda(soma / n, casas) : null);

/** Soma 0 quando o campo opcional não existe */
const n0 = (v: number | undefined) => (typeof v === 'number' && isFinite(v) ? v : 0);

function resumir(dados: DadosEvolucao, d0: number, d1: number): ResumoPeriodo {
  const dentro = (data: string) => {
    const d = diaNumero(data);
    return d >= d0 && d <= d1;
  };

  const porDia = new Map<string, { kcal: number; p: number; c: number; g: number; f: number }>();
  let refeicoes = 0;
  for (const r of dados.refeicoes) {
    if (!dentro(r.data)) continue;
    refeicoes++;
    const dia = porDia.get(r.data) ?? { kcal: 0, p: 0, c: 0, g: 0, f: 0 };
    dia.kcal += n0(r.kcal);
    dia.p += n0(r.proteinaG);
    dia.c += n0(r.carboidratoG);
    dia.g += n0(r.gorduraG);
    dia.f += n0(r.fibraG);
    porDia.set(r.data, dia);
  }
  const soma = { kcal: 0, p: 0, c: 0, g: 0, f: 0 };
  for (const v of porDia.values()) {
    soma.kcal += v.kcal; soma.p += v.p; soma.c += v.c; soma.g += v.g; soma.f += v.f;
  }
  const nDias = porDia.size;

  const aguaPorDia = new Map<string, number>();
  for (const a of dados.aguas) {
    if (dentro(a.data)) aguaPorDia.set(a.data, (aguaPorDia.get(a.data) ?? 0) + n0(a.ml));
  }
  const aguaTotal = [...aguaPorDia.values()].reduce((s, v) => s + v, 0);

  let exercicioMin = 0;
  let exercicioKcal = 0;
  const gastoPorDia = new Map<string, number>();
  for (const e of dados.exercicios) {
    if (!dentro(e.data)) continue;
    exercicioMin += n0(e.duracaoMin);
    exercicioKcal += n0(e.kcalGasto);
    gastoPorDia.set(e.data, (gastoPorDia.get(e.data) ?? 0) + n0(e.kcalGasto));
  }
  for (const t of dados.treinosGuia ?? []) {
    if (!dentro(t.data)) continue;
    exercicioMin += n0(t.minutos);
    exercicioKcal += n0(t.kcal);
    gastoPorDia.set(t.data, (gastoPorDia.get(t.data) ?? 0) + n0(t.kcal));
  }
  const gastoTotal = [...gastoPorDia.values()].reduce((s, v) => s + v, 0);
  const diasComAtividade = new Set([...porDia.keys(), ...gastoPorDia.keys()]).size;

  const pesos = dados.pesos
    .filter((p) => dentro(p.data))
    .sort((a, b) => diaNumero(a.data) - diaNumero(b.data));
  const pesoInicial = pesos.length ? pesos[0].pesoKg : null;
  const pesoFinal = pesos.length ? pesos[pesos.length - 1].pesoKg : null;

  const gl = dados.glicemias.filter((g) => dentro(g.data)).map(valorMgDl);
  const alvo = dados.alvoGlicemia;
  const glicemia: ResumoGlicemia = {
    medicoes: gl.length,
    mediaMgDl: gl.length ? arredonda(gl.reduce((s, v) => s + v, 0) / gl.length) : null,
    minimoMgDl: gl.length ? Math.min(...gl) : null,
    maximoMgDl: gl.length ? Math.max(...gl) : null,
    noAlvoPct: gl.length ? arredonda((gl.filter((v) => v >= alvo.min && v <= alvo.max).length / gl.length) * 100) : null,
  };

  return {
    dias: d1 - d0 + 1,
    diasComRefeicao: nDias,
    refeicoes,
    kcalMediaDia: mediaOuNull(soma.kcal, nDias),
    kcalGastaMediaDia: mediaOuNull(gastoTotal, diasComAtividade),
    kcalSaldoMediaDia: mediaOuNull(soma.kcal - gastoTotal, diasComAtividade),
    proteinaMediaDiaG: mediaOuNull(soma.p, nDias, 1),
    carboidratoMediaDiaG: mediaOuNull(soma.c, nDias, 1),
    gorduraMediaDiaG: mediaOuNull(soma.g, nDias, 1),
    fibraMediaDiaG: mediaOuNull(soma.f, nDias, 1),
    aguaMediaDiaMl: mediaOuNull(aguaTotal, aguaPorDia.size),
    exercicioMin: arredonda(exercicioMin),
    exercicioKcal: arredonda(exercicioKcal),
    pesoInicialKg: pesoInicial,
    pesoFinalKg: pesoFinal,
    pesoVariacaoKg: pesos.length >= 2 ? arredonda((pesoFinal as number) - (pesoInicial as number), 1) : null,
    glicemia,
    dosesGlp1: dados.dosesGlp1.filter((x) => dentro(x.data)).length,
    medicacoesRegistradas: dados.medicacoes.filter((x) => dentro(x.data)).length,
  };
}

/** Primeiro dia com qualquer registro (para "desde o início") */
function primeiroDia(dados: DadosEvolucao, hoje: number): number {
  const datas = [
    ...dados.refeicoes, ...dados.aguas, ...dados.pesos, ...dados.exercicios,
    ...dados.glicemias, ...dados.dosesGlp1, ...dados.medicacoes,
  ].map((r) => diaNumero(r.data)).filter((d) => isFinite(d) && d <= hoje);
  return datas.length ? Math.min(...datas) : hoje;
}

function montarBarras(dados: DadosEvolucao, d0: number, d1: number, tamanho: number): Barra[] {
  const barras: Barra[] = [];
  for (let ini = d0; ini <= d1; ini += tamanho) {
    const fim = Math.min(ini + tamanho - 1, d1);
    const r = resumir({ ...dados, pesos: [], glicemias: [], dosesGlp1: [], medicacoes: [], aguas: [] }, ini, fim);
    // a barra mostra o saldo (ingeridas − gastas); saldo negativo aparece como 0 no gráfico
    barras.push({ de: iso(ini), ate: iso(fim), kcal: Math.max(0, r.kcalSaldoMediaDia ?? 0), proteinaG: r.proteinaMediaDiaG ?? 0 });
  }
  return barras;
}

/**
 * Calcula a evolução de um período que termina em `hoje` (AAAA-MM-DD).
 * dia = hoje; semana = 7 dias; mês = 30 dias; início = do primeiro registro até hoje.
 */
export function calcularEvolucao(dados: DadosEvolucao, periodo: PeriodoEvolucao, hoje: string): Evolucao {
  const fim = diaNumero(hoje);
  let ini: number;
  if (periodo === 'dia') ini = fim;
  else if (periodo === 'semana') ini = fim - 6;
  else if (periodo === 'mes') ini = fim - 29;
  else ini = primeiroDia(dados, fim);

  const tamanhoDias = fim - ini + 1;
  const atual = resumir(dados, ini, fim);
  const anterior = periodo === 'inicio' ? null : resumir(dados, ini - tamanhoDias, ini - 1);

  // uma barra por dia até 31 dias; depois por semana (até ~6 meses) e por mês
  const porBarra = tamanhoDias <= 31 ? 1 : tamanhoDias <= 190 ? 7 : 30;
  const barras = periodo === 'dia' ? [] : montarBarras(dados, ini, fim, porBarra);

  const pesos = dados.pesos
    .filter((p) => { const d = diaNumero(p.data); return d >= ini && d <= fim; })
    .sort((a, b) => diaNumero(a.data) - diaNumero(b.data))
    .map((p) => ({ data: p.data, pesoKg: p.pesoKg }));

  const vazio =
    atual.refeicoes === 0 && atual.aguaMediaDiaMl === null && atual.exercicioMin === 0 &&
    pesos.length === 0 && atual.glicemia.medicoes === 0 && atual.dosesGlp1 === 0 && atual.medicacoesRegistradas === 0;

  return { periodo, de: iso(ini), ate: iso(fim), atual, anterior, barras, pesos, vazio };
}

/** Diferença atual − anterior; null se um dos lados não tem dado */
export function diferenca(atual: number | null, anterior: number | null, casas = 0): number | null {
  if (atual === null || anterior === null) return null;
  return arredonda(atual - anterior, casas);
}
