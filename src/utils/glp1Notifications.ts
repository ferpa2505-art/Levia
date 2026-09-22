import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('lembretes-glp1', {
    name: 'Lembretes de dose',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Pede permissão de notificação ao sistema, se ainda não foi concedida.
 * Retorna true se o usuário permitiu.
 */
export async function solicitarPermissaoNotificacao(): Promise<boolean> {
  const atual = await Notifications.getPermissionsAsync();
  if ((atual as { granted: boolean }).granted) return true;
  const resposta = await Notifications.requestPermissionsAsync();
  return (resposta as { granted: boolean }).granted;
}

/**
 * Cancela um lembrete agendado anteriormente (se existir).
 */
export async function cancelarLembreteDose(notificationId?: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // já pode não existir mais — sem problema
  }
}

/**
 * Agenda um lembrete de próxima dose para a data informada.
 * Retorna o id da notificação agendada, ou null se não foi possível agendar
 * (sem permissão, ou data já no passado).
 */
export async function agendarLembreteDose(dataProximaDose: Date): Promise<string | null> {
  if (dataProximaDose.getTime() <= Date.now()) return null;

  const permitido = await solicitarPermissaoNotificacao();
  if (!permitido) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora da sua próxima dose 💉',
      body: 'Não esqueça de aplicar e registrar a dose de hoje no Leviã.',
      ...(Platform.OS === 'android' ? { channelId: 'lembretes-glp1' } : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dataProximaDose,
    },
  });

  return id;
}
