import { Platform } from 'react-native';
import { getNotifications, solicitarPermissaoNotificacao } from '@utils/glp1Notifications';

const CANAL = 'lembretes-refeicao';

export async function cancelarLembreteRefeicao(id?: string | null) {
  const N = getNotifications();
  if (N && id) await N.cancelScheduledNotificationAsync(id).catch(() => {});
}

/** Agenda "hora da próxima refeição" para `quando`. Devolve o id ou null. */
export async function agendarLembreteRefeicao(quando: Date, titulo: string, corpo: string): Promise<string | null> {
  const N = getNotifications();
  if (!N || quando.getTime() <= Date.now() + 30_000) return null;
  if (!(await solicitarPermissaoNotificacao())) return null;
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(CANAL, { name: titulo, importance: N.AndroidImportance.DEFAULT }).catch(() => {});
  }
  const canal = Platform.OS === 'android' ? { channelId: CANAL } : {};
  try {
    return await N.scheduleNotificationAsync({
      content: { title: titulo, body: corpo, ...canal },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: quando, ...canal } as never,
    });
  } catch {
    return null;
  }
}
