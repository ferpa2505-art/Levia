import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { traduzirAtual as t } from '@/i18n';
import { montarHtmlRelatorio } from '@utils/relatorio';
import { getNotifications, solicitarPermissaoNotificacao } from '@utils/glp1Notifications';
import { cancelarNotificacoes } from '@utils/agendaMedicacao';
import { suspenderBloqueio } from '@utils/bloqueioSuspenso';

/**
 * Relatório semanal/mensal "semiautomático": o app avisa que o relatório está
 * pronto e, ao tocar, abre o app de e-mail com o PDF anexado e o endereço da
 * pessoa já preenchido — ela só confirma o envio. Nada sai do aparelho sem ela.
 */
export const TIPO_NOTIF_RELATORIO = 'relatorio';
const CANAL = 'relatorios';

/** Gera o PDF do período e abre o e-mail. Se não houver app de e-mail, abre o compartilhamento. */
export async function enviarRelatorioPorEmail(dias: number, email: string): Promise<'email' | 'compartilhado' | 'falhou'> {
  const html = await montarHtmlRelatorio(dias);
  const { uri } = await Print.printToFileAsync({ html });
  const periodo = dias <= 7 ? t('rel.semanal') : t('rel.mensal');
  suspenderBloqueio();
  if (await MailComposer.isAvailableAsync()) {
    await MailComposer.composeAsync({
      recipients: email ? [email] : [],
      subject: t('rel.assunto', { p: periodo }),
      body: t('rel.corpoEmail', { p: periodo }),
      attachments: [uri],
    });
    return 'email';
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t('rel.titulo') });
    return 'compartilhado';
  }
  return 'falhou';
}

/**
 * Agenda os avisos de relatório: semanal (segunda, 9h) e mensal (dia 1, 9h).
 * Cancela os anteriores e devolve os ids novos.
 */
export async function agendarAvisosRelatorio(semanal: boolean, mensal: boolean, idsAntigos: string[] = []): Promise<string[]> {
  await cancelarNotificacoes(idsAntigos);
  const N = getNotifications();
  if (!N || (!semanal && !mensal)) return [];
  if (!(await solicitarPermissaoNotificacao())) return [];
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(CANAL, { name: t('rel.canal'), importance: N.AndroidImportance.DEFAULT }).catch(() => {});
  }
  const canal = Platform.OS === 'android' ? { channelId: CANAL } : {};
  const T = N.SchedulableTriggerInputTypes;
  const ids: string[] = [];
  const agendar = async (dias: number, trigger: Record<string, unknown>) => {
    try {
      ids.push(
        await N.scheduleNotificationAsync({
          content: {
            title: t('rel.notifTitulo', { p: dias <= 7 ? t('rel.semanal') : t('rel.mensal') }),
            body: t('rel.notifCorpo'),
            data: { tipo: TIPO_NOTIF_RELATORIO, dias },
            ...canal,
          },
          trigger: { ...trigger, ...canal } as never,
        })
      );
    } catch {
      // segue sem este aviso
    }
  };
  // weekday do expo: 1 = domingo, 2 = segunda
  if (semanal) await agendar(7, { type: T.WEEKLY, weekday: 2, hour: 9, minute: 0 });
  if (mensal) await agendar(30, { type: T.MONTHLY, day: 1, hour: 9, minute: 0 });
  return ids;
}
