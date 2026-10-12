import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { suspenderBloqueio } from '@utils/bloqueioSuspenso';

/**
 * Fotos dos pratos: tiradas pela câmera ou escolhidas na galeria e copiadas
 * para a pasta privada do app. Nada sai do aparelho (a análise por IA entra
 * na versão paga e vai pedir consentimento antes de enviar a foto).
 */
const PASTA = `${FileSystem.documentDirectory}refeicoes/`;

export type ResultadoFoto = { uri: string } | { negado: true } | null;

async function guardar(uriTemporaria: string): Promise<string> {
  if (Platform.OS === 'web') return guardarNaWeb(uriTemporaria);
  await FileSystem.makeDirectoryAsync(PASTA, { intermediates: true }).catch(() => {});
  const destino = `${PASTA}${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uriTemporaria, to: destino });
  return destino;
}

export async function fotografarPrato(): Promise<ResultadoFoto> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return { negado: true };
  suspenderBloqueio();
  const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: false });
  if (r.canceled || !r.assets?.[0]) return null;
  return { uri: await guardar(r.assets[0].uri) };
}

export async function escolherFotoDaGaleria(): Promise<ResultadoFoto> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { negado: true };
  suspenderBloqueio();
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
  if (r.canceled || !r.assets?.[0]) return null;
  return { uri: await guardar(r.assets[0].uri) };
}

export async function apagarFoto(uri?: string) {
  if (uri && uri.startsWith(PASTA)) await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}

/**
 * Versão web (PWA): não existe pasta de arquivos. A foto é reduzida (máx. 512 px,
 * ~30–60 KB) e guardada como texto junto com a refeição, no armazenamento do app.
 * A análise da IA usa essa mesma foto.
 */
async function guardarNaWeb(uri: string): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  const original = await ctx.renderAsync();
  const deitada = original.width >= original.height;
  const lado = deitada ? original.width : original.height;
  if (lado > 512) ctx.resize(deitada ? { width: 512 } : { height: 512 });
  const img = lado > 512 ? await ctx.renderAsync() : original;
  const salva = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  if (!salva.base64) return uri;
  return `data:image/jpeg;base64,${salva.base64}`;
}
