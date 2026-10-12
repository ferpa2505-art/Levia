import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { traduzirAtual } from '@/i18n';

/**
 * Desde a SDK 53, importar 'expo-notifications' no Expo Go (Android) já gera
 * erro e derruba o app. Por isso o módulo é carregado sob demanda (require),
 * só fora do Expo Go. No Expo Go as funções abaixo não fazem nada; no app
 * instalado (development build ou produção) os lembretes funcionam normal.
 */
const isExpoGo =
  Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let jaTentouCarregar = false;

/** Na versão web (PWA) não há lembretes agendados pelo navegador. */
const lembretesDisponiveis = Platform.OS !== 'web';

export function getNotifications(): NotificationsModule | null {
  if (isExpoGo || !lembretesDisponiveis) return null;
  if (jaTentouCarregar) return notificationsModule;
  jaTentouCarregar = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch {
    notificationsModule = null;
  }
  return notificationsModule;
}

(function configurarNotificacoes() {
  const Notifications = getNotifications();
  if (!Notifications) return;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('lembretes-glp1', {
      name: traduzirAtual('notif.canal'),
      importance: Notifications.AndroidImportance.HIGH,
    }).catch(() => {});
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
})();

export async function solicitarPermissaoNotificacao(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  try {
    const atual = await Notifications.getPermissionsAsync();
    if ((atual as { granted: boolean }).granted) return true;
    const resposta = await Notifications.requestPermissionsAsync();
    return (resposta as { granted: boolean }).granted;
  } catch {
    return false;
  }
}

export async function cancelarLembreteDose(notificationId?: string | null): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // já pode não existir mais — sem problema
  }
}

export async function agendarLembreteDose(dataProximaDose: Date): Promise<string | null> {
  const Notifications = getNotifications();
  if (!Notifications) return null;
  if (dataProximaDose.getTime() <= Date.now()) return null;

  const permitido = await solicitarPermissaoNotificacao();
  if (!permitido) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: traduzirAtual('notif.titulo'),
        body: traduzirAtual('notif.corpo'),
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

export { isExpoGo, lembretesDisponiveis };
