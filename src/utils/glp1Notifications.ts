import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * A partir da SDK 53, o Expo Go não suporta mais a API de notificações
 * (não só push remoto — praticamente tudo). Detectamos isso aqui pra evitar
 * que o app trave: dentro do Expo Go, essas funções simplesmente não fazem
 * nada (o lembrete fica "ativado" nas configurações, mas a notificação em
 * si só dispara de verdade num development build ou build de produção).
 */
const isExpoGo =
  Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

if (Platform.OS === 'android' && !isExpoGo) {
  Notifications.setNotificationChannelAsync('lembretes-glp1', {
    name: 'Lembretes de dose',
    importance: Notifications.AndroidImportance.HIGH,
  }).catch(() => {});
}

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Pede permissão de notificação ao sistema, se ainda não foi concedida.
 * Retorna true se o usuário permitiu. No Expo Go, sempre retorna false.
 */
export async function solicitarPermissaoNotificacao(): Promise<boolean> {
  if (isExpoGo) return false;
  try {
    const atual = await Notifications.getPermissionsAsync();
    if ((atual as { granted: boolean }).granted) return true;
    const resposta = await Notifications.requestPermissionsAsync();
    return (resposta as { granted: boolean }).granted;
  } catch {
    return false;
  }
}

/**
 * Cancela um lembrete agendado anteriormente (se existir).
 */
export async function cancelarLembreteDose(notificationId?: string | null): Promise<void> {
  if (isExpoGo || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // já pode não existir mais — sem problema
  }
}

/**
 * Agenda um lembrete de próxima dose para a data informada.
 * Retorna o id da notificação agendada, ou null se não foi possível agendar
 * (Expo Go, sem permissão, ou data já no passado).
 */
export async function agendarLembreteDose(dataProximaDose: Date): Promise<string | null> {
  if (isExpoGo) return null;
  if (dataProximaDose.getTime() <= Date.now()) return null;

  const permitido = await solicitarPermissaoNotificacao();
  if (!permitido) return null;

  try {
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
  } catch {
    return null;
  }
}

export { isExpoGo };
