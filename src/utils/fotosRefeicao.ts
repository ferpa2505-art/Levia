import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { suspenderBloqueio } from '@utils/bloqueioSuspenso';
import { dimensoesReduzidas } from '@utils/dimensoesFoto';

/**
 * Fotos dos pratos: tiradas pela câmera ou escolhidas na galeria e copiadas
 * para a pasta privada do app. A análise por IA é opcional e pede consentimento
 * antes de enviar uma cópia reduzida da foto para o serviço de análise.
 */
const PASTA = `${FileSystem.documentDirectory}refeicoes/`;
const LADO_MAXIMO_WEB = 512;

export type ResultadoFoto = { uri: string } | { negado: true } | null;

/** O pedaço do navegador usado na versão web (o projeto não carrega os tipos do DOM). */
interface ImagemWeb { src: string; naturalWidth: number; naturalHeight: number; decode(): Promise<void> }
interface TelaWeb {
  width: number;
  height: number;
  getContext(tipo: '2d'): { drawImage(imagem: ImagemWeb, x: number, y: number, l: number, a: number): void } | null;
  toDataURL(tipo: string, qualidade: number): string;
}
interface Navegador { Image: new () => ImagemWeb; document: { createElement(nome: 'canvas'): TelaWeb } }

async function guardar(uriTemporaria: string): Promise<string> {
  if (Platform.OS === 'web') return guardarNaWeb(uriTemporaria);
  await FileSystem.makeDirectoryAsync(PASTA, { intermediates: true }).catch(() => {});
  const destino = `${PASTA}${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uriTemporaria, to: destino });
  return destino;
}

/** `aoEscolher` avisa que a foto já foi escolhida e começou a ser preparada. */
export async function fotografarPrato(aoEscolher?: () => void): Promise<ResultadoFoto> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return { negado: true };
  suspenderBloqueio();
  const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: false });
  if (r.canceled || !r.assets?.[0]) return null;
  aoEscolher?.();
  return { uri: await guardar(r.assets[0].uri) };
}

export async function escolherFotoDaGaleria(aoEscolher?: () => void): Promise<ResultadoFoto> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { negado: true };
  suspenderBloqueio();
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
  if (r.canceled || !r.assets?.[0]) return null;
  aoEscolher?.();
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
  const navegador = globalThis as unknown as Navegador;
  const original = new navegador.Image();
  original.src = uri;
  await original.decode(); // falha aqui quando o navegador não abre o formato (ex.: HEIC)
  // desenha direto no tamanho final: sem cópias da foto em tamanho cheio, que demoravam em fotos grandes
  const { largura, altura } = dimensoesReduzidas(original.naturalWidth, original.naturalHeight, LADO_MAXIMO_WEB);
  const tela = navegador.document.createElement('canvas');
  tela.width = largura;
  tela.height = altura;
  const desenho = tela.getContext('2d');
  if (!desenho) throw new Error('navegador sem canvas');
  desenho.drawImage(original, 0, 0, largura, altura);
  const dados = tela.toDataURL('image/jpeg', 0.6);
  if (!dados.startsWith('data:image/jpeg')) throw new Error('foto não convertida');
  return dados;
}
