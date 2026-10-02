import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Fotos dos pratos: tiradas pela câmera ou escolhidas na galeria e copiadas
 * para a pasta privada do app. Nada sai do aparelho (a análise por IA entra
 * na versão paga e vai pedir consentimento antes de enviar a foto).
 */
const PASTA = `${FileSystem.documentDirectory}refeicoes/`;

export type ResultadoFoto = { uri: string } | { negado: true } | null;

async function guardar(uriTemporaria: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(PASTA, { intermediates: true }).catch(() => {});
  const destino = `${PASTA}${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uriTemporaria, to: destino });
  return destino;
}

export async function fotografarPrato(): Promise<ResultadoFoto> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return { negado: true };
  const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: false });
  if (r.canceled || !r.assets?.[0]) return null;
  return { uri: await guardar(r.assets[0].uri) };
}

export async function escolherFotoDaGaleria(): Promise<ResultadoFoto> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { negado: true };
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
  if (r.canceled || !r.assets?.[0]) return null;
  return { uri: await guardar(r.assets[0].uri) };
}

export async function apagarFoto(uri?: string) {
  if (uri && uri.startsWith(PASTA)) await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}
