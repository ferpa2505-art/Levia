import { Platform } from 'react-native';
import type { Medicacao } from '@models/medicacoes';
import { rotuloUnidade } from '@models/medicacoes';
import { getNotifications, solicitarPermissaoNotificacao } from '@utils/glp1Notifications';

import {
  lerHorario,
  horariosDoDia,
  dosesDoTratamento,
  inicioDoTratamento,
  proximaDose,
} from '@utils/posologia';

export * from '@utils/posologia';

/* ------------------------------------------------------------------
 * Notificações
 * ------------------------------------------------------------------ */

const CANAL = 'lembretes-medicacao';
/** Limite de lembretes por tratamento (o Android aceita ~500 agendamentos no total) */
const MAX_DOSES_AGENDADAS = 60;

function textoDose(m: Medicacao, idioma: string) {
  return `${m.nome}${m.dose ? ` · ${m.dose} ${rotuloUnidade(m.unidade, idioma)}` : ''}`;
}

export async function cancelarNotificacoes(ids: string[]) {
  const N = getNotifications();
  if (!N || ids.length === 0) return;
  await Promise.all(ids.map((id) => N.cancelScheduledNotificationAsync(id).catch(() => {})));
}

/** Agenda os lembretes da medicação. Devolve os ids (vazio se desligado ou sem permissão). */
export async function agendarNotificacoes(m: Medicacao, titulo: string, idioma: string): Promise<string[]> {
  const N = getNotifications();
  if (!N || !m.lembretes || m.uso === 'esporadico') return [];
  if (!(await solicitarPermissaoNotificacao())) return [];
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(CANAL, {
      name: titulo,
      importance: N.AndroidImportance.HIGH,
    }).catch(() => {});
  }
  const T = N.SchedulableTriggerInputTypes;
  const canal = Platform.OS === 'android' ? { channelId: CANAL } : {};
  const conteudo = {
    title: titulo,
    body: textoDose(m, idioma),
    data: { medicacaoId: m.id },
    ...canal,
  };

  const gatilhos: Record<string, unknown>[] = [];
  if (m.uso === 'continuo') {
    const hm = lerHorario(m.primeiraDose);
    if (!hm) return [];
    if (m.frequencia === 'semanal') {
      gatilhos.push({ type: T.WEEKLY, weekday: (m.diaSemana ?? new Date().getDay()) + 1, hour: hm[0], minute: hm[1] });
    } else {
      for (const h of horariosDoDia(m.primeiraDose!, m.intervaloHoras ?? 24)) {
        const [hora, minuto] = lerHorario(h)!;
        gatilhos.push({ type: T.DAILY, hour: hora, minute: minuto });
      }
    }
  } else {
    const ini = inicioDoTratamento(m);
    if (!ini) return [];
    const futuras = dosesDoTratamento(ini, m.dias ?? 0, m.vezesPorDia ?? 0)
      .filter((d) => d.getTime() > Date.now() + 30_000)
      .slice(0, MAX_DOSES_AGENDADAS);
    for (const date of futuras) gatilhos.push({ type: T.DATE, date });
  }

  const ids: string[] = [];
  for (const g of gatilhos) {
    try {
      ids.push(await N.scheduleNotificationAsync({ content: conteudo, trigger: { ...g, ...canal } as never }));
    } catch {
      // um horário com problema não impede os demais
    }
  }
  return ids;
}

/* ------------------------------------------------------------------
 * Calendário do celular (aparece no Google Agenda se a conta Google
 * estiver no aparelho)
 * ------------------------------------------------------------------ */

type CalendarModule = typeof import('expo-calendar');
function getCalendar(): CalendarModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-calendar') as CalendarModule;
  } catch {
    return null;
  }
}

async function escolherCalendario(C: CalendarModule): Promise<string | null> {
  const lista = await C.getCalendarsAsync(C.EntityTypes.EVENT);
  const editaveis = lista.filter((c) => c.allowsModifications);
  const google = editaveis.find((c) => (c.source?.type ?? '').includes('google') && c.isPrimary)
    ?? editaveis.find((c) => (c.source?.type ?? '').includes('google'))
    ?? editaveis.find((c) => c.isPrimary)
    ?? editaveis[0];
  return google?.id ?? null;
}

export async function removerEventos(ids: string[]) {
  const C = getCalendar();
  if (!C || ids.length === 0) return;
  for (const id of ids) {
    await C.deleteEventAsync(id, { futureEvents: true }).catch(() => {});
  }
}

/**
 * Cria eventos recorrentes no calendário: um por horário do dia.
 * Contínuo: repete todo dia (ou toda semana). Tratamento: repete pelo número de dias.
 * Devolve { ids, permitido } — permitido=false se o usuário negou o calendário.
 */
export async function criarEventos(m: Medicacao, titulo: string, idioma: string): Promise<{ ids: string[]; permitido: boolean }> {
  const C = getCalendar();
  if (!C || !m.calendario || m.uso === 'esporadico') return { ids: [], permitido: true };
  const perm = await C.requestCalendarPermissionsAsync().catch(() => null);
  if (!perm || perm.status !== 'granted') return { ids: [], permitido: false };
  const calendarId = await escolherCalendario(C).catch(() => null);
  if (!calendarId) return { ids: [], permitido: true };

  const inicios: Date[] = [];
  let regra: { frequency: string; occurrence?: number } = { frequency: C.Frequency.DAILY };
  if (m.uso === 'continuo') {
    const prox = proximaDose(m);
    if (!prox) return { ids: [], permitido: true };
    if (m.frequencia === 'semanal') {
      inicios.push(prox);
      regra = { frequency: C.Frequency.WEEKLY };
    } else {
      for (const h of horariosDoDia(m.primeiraDose!, m.intervaloHoras ?? 24)) {
        const [hora, minuto] = lerHorario(h)!;
        const d = new Date();
        d.setHours(hora, minuto, 0, 0);
        if (d < new Date()) d.setDate(d.getDate() + 1);
        inicios.push(d);
      }
    }
  } else {
    const ini = inicioDoTratamento(m);
    if (!ini) return { ids: [], permitido: true };
    // as doses do 1º dia; cada uma repete pelo número de dias do tratamento
    inicios.push(...dosesDoTratamento(ini, 1, m.vezesPorDia ?? 1));
    regra = { frequency: C.Frequency.DAILY, occurrence: m.dias ?? 1 };
  }

  const ids: string[] = [];
  for (const startDate of inicios) {
    try {
      ids.push(
        await C.createEventAsync(calendarId, {
          title: `${titulo}: ${textoDose(m, idioma)}`,
          startDate,
          endDate: new Date(startDate.getTime() + 15 * 60_000),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          alarms: [{ relativeOffset: 0 }],
          recurrenceRule: regra as never,
          notes: m.observacoes,
        })
      );
    } catch {
      // segue com os demais horários
    }
  }
  return { ids, permitido: true };
}
