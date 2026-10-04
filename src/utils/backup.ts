import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';
import { getNotifications } from '@utils/glp1Notifications';
import { suspenderBloqueio } from '@utils/bloqueioSuspenso';

/**
 * Backup completo dos dados do Leviã num arquivo .json que a pessoa guarda
 * onde quiser (Drive, WhatsApp, e-mail) e restaura depois — inclusive em
 * outro celular. As fotos dos pratos não entram (ficam só no aparelho).
 */
const FORMATO = 1;
/** Chaves que não entram no backup (cache que o app refaz sozinho) */
const IGNORAR = new Set(['levia:news_cache']);
/** Depois de restaurar, as medicações reagendam os lembretes ao abrir */
export const CHAVE_REAGENDAR = 'levia:reagendarLembretes';

interface ArquivoBackup {
  app: 'levia';
  formato: number;
  versaoApp: string;
  exportadoEm: string;
  dados: Record<string, string>;
}

function chaveDoLevia(k: string) {
  return (k.startsWith('levia:') || k.startsWith('@levia/')) && !IGNORAR.has(k) && k !== CHAVE_REAGENDAR;
}

export async function exportarBackup(tituloCompartilhar: string): Promise<boolean> {
  const chaves = (await AsyncStorage.getAllKeys()).filter(chaveDoLevia);
  const pares = await AsyncStorage.multiGet(chaves);
  const arquivo: ArquivoBackup = {
    app: 'levia',
    formato: FORMATO,
    versaoApp: Constants.expoConfig?.version ?? '',
    exportadoEm: new Date().toISOString(),
    dados: Object.fromEntries(pares.filter(([, v]) => v != null) as [string, string][]),
  };
  const hoje = new Date().toISOString().slice(0, 10);
  const uri = `${FileSystem.cacheDirectory}levia-backup-${hoje}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(arquivo));
  if (!(await Sharing.isAvailableAsync())) return false;
  suspenderBloqueio();
  await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: tituloCompartilhar });
  return true;
}

export type BackupLido =
  | { ok: true; exportadoEm: string; dados: Record<string, string> }
  | { ok: false; motivo: 'cancelado' | 'invalido' };

/** Abre o seletor de arquivos e valida o backup escolhido (ainda não aplica) */
export async function escolherBackup(): Promise<BackupLido> {
  suspenderBloqueio();
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (r.canceled || !r.assets?.[0]) return { ok: false, motivo: 'cancelado' };
  try {
    const texto = await FileSystem.readAsStringAsync(r.assets[0].uri);
    const b = JSON.parse(texto) as Partial<ArquivoBackup>;
    if (b.app !== 'levia' || typeof b.dados !== 'object' || !b.dados) return { ok: false, motivo: 'invalido' };
    const dados = Object.fromEntries(Object.entries(b.dados).filter(([k, v]) => chaveDoLevia(k) && typeof v === 'string'));
    return { ok: true, exportadoEm: b.exportadoEm ?? '', dados };
  } catch {
    return { ok: false, motivo: 'invalido' };
  }
}

/** Substitui os dados atuais pelos do backup. Depois disso o app precisa reiniciar. */
export async function aplicarBackup(dados: Record<string, string>) {
  const atuais = (await AsyncStorage.getAllKeys()).filter(chaveDoLevia);
  await AsyncStorage.multiRemove(atuais);
  await AsyncStorage.multiSet([...Object.entries(dados), [CHAVE_REAGENDAR, '1']]);
  // lembretes antigos deste aparelho não valem mais; as medicações reagendam ao abrir
  await getNotifications()?.cancelAllScheduledNotificationsAsync().catch(() => {});
}
