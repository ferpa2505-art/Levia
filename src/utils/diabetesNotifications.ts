import { Platform } from 'react-native';
import type { RegistroMedicacao } from '@models/diabetes';
import { getNotifications, solicitarPermissaoNotificacao } from '@utils/glp1Notifications';

/**
 * Lembretes de medicação agendados no próprio aparelho, para tocarem mesmo
 * com o app fechado. Cada horário do alarme vira uma notificação recorrente
 * (diária, semanal ou mensal). No Expo Go as funções não fazem nada.
 */
const CANAL = 'lembretes-medicacao';

let canalCriado = false;

async function garantirCanal() {
  const Notifications = getNotifications();
  if (!Notifications || canalCriado || Platform.OS !== 'android') return;
  canalCriado = true;
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Lembretes de medicação',
    importance: Notifications.AndroidImportance.HIGH,
  }).catch(() => {});
}

export async function cancelarAlarmesMedicacao(ids?: string[]): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || !ids?.length) return;
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
  );
}

/**
 * Cancela os lembretes antigos da medicação e agenda os novos.
 * Devolve os ids agendados (vazio se o alarme estiver desligado ou sem permissão).
 */
export async function agendarAlarmesMedicacao(medicacao: RegistroMedicacao): Promise<string[]> {
  const Notifications = getNotifications();
  const alarme = medicacao.alarme;
  await cancelarAlarmesMedicacao(alarme?.notificationIds);

  if (!Notifications || !alarme?.ativado || !alarme.notificacaoAtivada || !alarme.horarios?.length) {
    return [];
  }
  if (!(await solicitarPermissaoNotificacao())) return [];
  await garantirCanal();

  const T = Notifications.SchedulableTriggerInputTypes;
  const hoje = new Date();
  const diaDoMes = Math.min(alarme.diaDoMes ?? hoje.getDate(), 28);

  const ids: string[] = [];
  for (const horario of alarme.horarios) {
    const [hour, minute] = horario.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) continue;

    let gatilhos: Record<string, unknown>[];
    switch (alarme.frequencia) {
      case 'semanal':
        // weekday do expo: 1 = domingo ... 7 = sábado
        gatilhos = (alarme.diasDaSemana?.length ? alarme.diasDaSemana : [hoje.getDay()]).map(
          (dia) => ({ type: T.WEEKLY, weekday: dia + 1, hour, minute })
        );
        break;
      case 'mensal':
        gatilhos = [{ type: T.MONTHLY, day: diaDoMes, hour, minute }];
        break;
      case 'quinzenal':
        // Sem gatilho nativo de 15 dias: dois lembretes mensais, com 14 dias de intervalo
        gatilhos = [
          { type: T.MONTHLY, day: diaDoMes, hour, minute },
          { type: T.MONTHLY, day: ((diaDoMes + 13) % 28) + 1, hour, minute },
        ];
        break;
      default:
        // De hora em hora até diária: cada horário gerado repete todo dia
        gatilhos = [{ type: T.DAILY, hour, minute }];
    }

    for (const trigger of gatilhos) {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '💊 Lembrete de medicação',
            body: `Hora de tomar ${medicacao.medicamento} (${medicacao.dosagem})`,
            data: { medicacaoId: medicacao.id },
            ...(Platform.OS === 'android' ? { channelId: CANAL } : null),
          },
          trigger: (Platform.OS === 'android' ? { ...trigger, channelId: CANAL } : trigger) as never,
        });
        ids.push(id);
      } catch {
        // um horário inválido não impede os outros
      }
    }
  }
  return ids;
}
