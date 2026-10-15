import type { Medicacao } from '@models/medicacoes';

/* ------------------------------------------------------------------
 * Cálculo dos horários (funções puras)
 * ------------------------------------------------------------------ */

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** "08:30" -> [8, 30] (ou null se inválido) */
export function lerHorario(texto?: string): [number, number] | null {
  const m = (texto ?? '').trim().match(/^(\d{1,2})[:h.]?(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h > 23 || min > 59 ? null : [h, min];
}

/** "dd/mm/aaaa" -> Date (00:00) ou null */
export function lerData(texto?: string): Date | null {
  const m = (texto ?? '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return d.getDate() === Number(m[1]) ? d : null;
}

/** Horários do dia do uso contínuo a cada N horas, a partir da 1ª dose. Ex.: 07:30 a cada 8h -> 07:30, 15:30, 23:30 */
export function horariosDoDia(primeiraDose: string, intervaloHoras: number): string[] {
  const hm = lerHorario(primeiraDose);
  if (!hm || intervaloHoras <= 0) return [];
  const [h, min] = hm;
  const lista: string[] = [];
  for (let k = 0; k < Math.max(1, Math.floor(24 / intervaloHoras)); k++) {
    lista.push(`${pad((h + k * intervaloHoras) % 24)}:${pad(min)}`);
  }
  return lista.sort();
}

/** Todas as doses de um tratamento: N dias × X vezes ao dia, a partir do início */
export function dosesDoTratamento(inicio: Date, dias: number, vezesPorDia: number): Date[] {
  if (!(dias > 0) || !(vezesPorDia > 0)) return [];
  const intervalo = (24 / vezesPorDia) * 3600_000;
  return Array.from({ length: dias * vezesPorDia }, (_, k) => new Date(inicio.getTime() + k * intervalo));
}

export function inicioDoTratamento(m: Medicacao): Date | null {
  if (!m.inicio) return null;
  const d = new Date(m.inicio);
  return isNaN(d.getTime()) ? null : d;
}

/** Próxima dose a partir de agora (null se esporádico ou tratamento já terminou) */
export function proximaDose(m: Medicacao, agora = new Date()): Date | null {
  if (m.uso === 'tratamento') {
    const ini = inicioDoTratamento(m);
    if (!ini) return null;
    return dosesDoTratamento(ini, m.dias ?? 0, m.vezesPorDia ?? 0).find((d) => d > agora) ?? null;
  }
  if (m.uso !== 'continuo') return null;
  const hm = lerHorario(m.primeiraDose);
  if (!hm) return null;
  if (m.frequencia === 'semanal') {
    const d = new Date(agora);
    d.setHours(hm[0], hm[1], 0, 0);
    const alvo = m.diaSemana ?? agora.getDay();
    let diff = (alvo - d.getDay() + 7) % 7;
    if (diff === 0 && d <= agora) diff = 7;
    d.setDate(d.getDate() + diff);
    return d;
  }
  const candidatos: Date[] = [];
  for (const dia of [0, 1]) {
    for (const hor of horariosDoDia(m.primeiraDose!, m.intervaloHoras ?? 24)) {
      const [h, min] = lerHorario(hor)!;
      const d = new Date(agora);
      d.setDate(d.getDate() + dia);
      d.setHours(h, min, 0, 0);
      candidatos.push(d);
    }
  }
  return candidatos.filter((d) => d > agora).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
}

/** Fim do tratamento (última dose) */
export function fimDoTratamento(m: Medicacao): Date | null {
  const ini = inicioDoTratamento(m);
  if (m.uso !== 'tratamento' || !ini) return null;
  const doses = dosesDoTratamento(ini, m.dias ?? 0, m.vezesPorDia ?? 0);
  return doses[doses.length - 1] ?? null;
}
