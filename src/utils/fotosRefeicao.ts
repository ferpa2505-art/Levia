import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { suspenderBloqueio } from '@utils/bloqueioSuspenso';
import { dimensoesReduzidas } from '@utils/dimensoesFoto';
import { ErroFoto, tipoSeguro } from '@utils/erroFoto';

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
interface ArquivoWeb { type: string }
interface EntradaWeb {
  type: string;
  accept: string;
  files: ArrayLike<ArquivoWeb> | null;
  style: { display: string };
  addEventListener(evento: 'change' | 'cancel', fn: () => void): void;
  click(): void;
  remove(): void;
}
interface Navegador {
  Image: new () => ImagemWeb;
  document: { createElement(nome: 'canvas'): TelaWeb; createElement(nome: 'input'): EntradaWeb; body: { appendChild(e: EntradaWeb): void } };
  URL: { createObjectURL(a: ArquivoWeb): string; revokeObjectURL(u: string): void };
}
const navegador = () => globalThis as unknown as Navegador;

async function guardar(uriTemporaria: string, tipo: string): Promise<string> {
  if (Platform.OS === 'web') return guardarNaWeb(uriTemporaria, tipo);
  await FileSystem.makeDirectoryAsync(PASTA, { intermediates: true }).catch(() => {});
  const destino = `${PASTA}${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uriTemporaria, to: destino });
  return destino;
}

/** O seletor falha antes de devolver o arquivo quando não reconhece o tipo dele. */
async function selecionar<T>(abrir: () => Promise<T>): Promise<T> {
  try {
    return await abrir();
  } catch (e) {
    const informado = e instanceof Error ? /file type: (\S*?)\.(?:\s|$)/i.exec(e.message)?.[1] : undefined;
    throw new ErroFoto('selecionar', tipoSeguro(informado), e);
  }
}

/** `aoEscolher` avisa que a foto já foi escolhida e começou a ser preparada. */
export async function fotografarPrato(aoEscolher?: () => void): Promise<ResultadoFoto> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return { negado: true };
  suspenderBloqueio();
  const r = await selecionar(() => ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: false }));
  if (r.canceled || !r.assets?.[0]) return null;
  aoEscolher?.();
  return { uri: await guardar(r.assets[0].uri, tipoSeguro(r.assets[0].mimeType)) };
}

export async function escolherFotoDaGaleria(aoEscolher?: () => void): Promise<ResultadoFoto> {
  if (Platform.OS === 'web') return escolherNaWeb(aoEscolher);
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { negado: true };
  suspenderBloqueio();
  const r = await selecionar(() => ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 }));
  if (r.canceled || !r.assets?.[0]) return null;
  aoEscolher?.();
  return { uri: await guardar(r.assets[0].uri, tipoSeguro(r.assets[0].mimeType)) };
}

/**
 * Galeria na PWA. O seletor do expo-image-picker recusa arquivos que o navegador entrega sem tipo
 * (ou como "application/octet-stream") antes de abri-los. Aqui o arquivo é aceito e a imagem é
 * testada de verdade ao abrir; se não abrir, a falha diz a etapa.
 */
function escolherNaWeb(aoEscolher?: () => void): Promise<ResultadoFoto> {
  suspenderBloqueio();
  const nav = navegador();
  const entrada = nav.document.createElement('input');
  entrada.type = 'file';
  entrada.accept = 'image/*';
  entrada.style.display = 'none';
  nav.document.body.appendChild(entrada);
  return new Promise<ResultadoFoto>((resolve, reject) => {
    let terminou = false;
    const fim = () => { terminou = true; entrada.remove(); };
    entrada.addEventListener('cancel', () => { if (!terminou) { fim(); resolve(null); } });
    entrada.addEventListener('change', () => {
      if (terminou) return;
      fim();
      const arquivo = entrada.files?.[0];
      if (!arquivo) return resolve(null);
      aoEscolher?.();
      const endereco = nav.URL.createObjectURL(arquivo);
      guardarNaWeb(endereco, tipoSeguro(arquivo.type))
        .then((uri) => resolve({ uri }), reject)
        .finally(() => nav.URL.revokeObjectURL(endereco));
    });
    entrada.click();
  });
}

export async function apagarFoto(uri?: string) {
  if (uri && uri.startsWith(PASTA)) await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}

/**
 * Versão web (PWA): não existe pasta de arquivos. A foto é reduzida (máx. 512 px,
 * ~30–60 KB) e guardada como texto junto com a refeição, no armazenamento do app.
 * A análise da IA usa essa mesma foto. Cada etapa que falha vira um ErroFoto.
 */
async function guardarNaWeb(uri: string, tipo: string): Promise<string> {
  const nav = navegador();
  const original = new nav.Image();
  try {
    original.src = uri;
    await original.decode();
  } catch (e) {
    throw new ErroFoto('abrir', tipo, e);
  }
  try {
    // desenha direto no tamanho final: sem cópias da foto em tamanho cheio, que demoravam em fotos grandes
    const { largura, altura } = dimensoesReduzidas(original.naturalWidth, original.naturalHeight, LADO_MAXIMO_WEB);
    const tela = nav.document.createElement('canvas');
    tela.width = largura;
    tela.height = altura;
    const desenho = tela.getContext('2d');
    if (!desenho) throw new Error('navegador sem canvas');
    desenho.drawImage(original, 0, 0, largura, altura);
    const dados = tela.toDataURL('image/jpeg', 0.6);
    if (!dados.startsWith('data:image/jpeg')) throw new Error('foto não convertida');
    return dados;
  } catch (e) {
    throw new ErroFoto('converter', tipo, e);
  }
}
