import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';
import { getNotifications } from '@utils/glp1Notifications';
import { suspenderBloqueio } from '@utils/bloqueioSuspenso';
import { getRandomBytes } from 'expo-crypto';
import { cifrar, decifrar, DadosCifrados } from '@utils/cifraBackup';

/**
 * Backup completo dos dados do Leviã num arquivo .json que a pessoa guarda
 * onde quiser (Drive, WhatsApp, e-mail) e restaura depois — inclusive em
 * outro celular. As fotos dos pratos não entram (ficam só no aparelho).
 */
/** 1 = dados abertos; 2 = dados cifrados com senha (campo `cifrado`) */
const FORMATO = 1;
const FORMATO_CIFRADO = 2;
/** Chaves que não entram no backup (cache que o app refaz sozinho; id do aparelho) */
const IGNORAR = new Set(['levia:news_cache', 'levia:instalacao']);
/** Depois de restaurar, as medicações reagendam os lembretes ao abrir */
export const CHAVE_REAGENDAR = 'levia:reagendarLembretes';

interface ArquivoBackup {
  app: 'levia';
  formato: number;
  versaoApp: string;
  exportadoEm: string;
  /** formato 1 */
  dados?: Record<string, string>;
  /** formato 2: o JSON de `dados`, cifrado */
  cifrado?: DadosCifrados;
}

function chaveDoLevia(k: string) {
  return (k.startsWith('levia:') || k.startsWith('@levia/')) && !IGNORAR.has(k) && k !== CHAVE_REAGENDAR;
}

/** Gera o arquivo e abre o compartilhamento. Com `senha`, os dados vão cifrados. */
export async function exportarBackup(tituloCompartilhar: string, senha?: string): Promise<boolean> {
  const chaves = (await AsyncStorage.getAllKeys()).filter(chaveDoLevia);
  const pares = await AsyncStorage.multiGet(chaves);
  const dados = Object.fromEntries(pares.filter(([, v]) => v != null) as [string, string][]);
  const base = {
    app: 'levia' as const,
    versaoApp: Constants.expoConfig?.version ?? '',
    exportadoEm: new Date().toISOString(),
  };
  const arquivo: ArquivoBackup = senha
    ? { ...base, formato: FORMATO_CIFRADO, cifrado: await cifrar(JSON.stringify(dados), senha, getRandomBytes) }
    : { ...base, formato: FORMATO, dados };
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
  /** arquivo com senha: chame abrirBackupCifrado(cifrado, senha) */
  | { ok: true; exportadoEm: string; cifrado: DadosCifrados }
  | { ok: false; motivo: 'cancelado' | 'invalido' };

function filtrarDados(dados: unknown): Record<string, string> | null {
  if (typeof dados !== 'object' || !dados) return null;
  return Object.fromEntries(Object.entries(dados).filter(([k, v]) => chaveDoLevia(k) && typeof v === 'string')) as Record<string, string>;
}

/** Abre um backup com senha. null = senha errada ou arquivo alterado. */
export async function abrirBackupCifrado(cifrado: DadosCifrados, senha: string): Promise<Record<string, string> | null> {
  const texto = await decifrar(cifrado, senha);
  if (texto == null) return null;
  try {
    return filtrarDados(JSON.parse(texto));
  } catch {
    return null;
  }
}

/** Abre o seletor de arquivos e valida o backup escolhido (ainda não aplica) */
export async function escolherBackup(): Promise<BackupLido> {
  suspenderBloqueio();
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (r.canceled || !r.assets?.[0]) return { ok: false, motivo: 'cancelado' };
  try {
    const texto = await FileSystem.readAsStringAsync(r.assets[0].uri);
    const b = JSON.parse(texto) as Partial<ArquivoBackup>;
    if (b.app !== 'levia') return { ok: false, motivo: 'invalido' };
    if (b.formato === FORMATO_CIFRADO && b.cifrado && typeof b.cifrado === 'object') {
      return { ok: true, exportadoEm: b.exportadoEm ?? '', cifrado: b.cifrado };
    }
    const dados = filtrarDados(b.dados);
    if (!dados) return { ok: false, motivo: 'invalido' };
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
