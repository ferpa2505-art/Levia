/**
 * Regressão da Galeria na PWA. Antes, o seletor recusava fotos que o navegador entrega sem tipo
 * e o app mostrava "A análise não funcionou", sem chamar a IA. Agora a foto é aberta de verdade
 * e, se falhar, o aviso diz a etapa sem nome, caminho ou conteúdo da foto.
 */
const mockCamera = jest.fn();

jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('expo-file-system/legacy', () => ({ documentDirectory: null }));
jest.mock('@utils/bloqueioSuspenso', () => ({ suspenderBloqueio: () => {} }));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: async () => ({ granted: true }),
  requestMediaLibraryPermissionsAsync: async () => ({ granted: true }),
  launchCameraAsync: (...a: unknown[]) => mockCamera(...a),
  launchImageLibraryAsync: () => { throw new Error('a galeria da web não deve usar o seletor do expo'); },
}));

import { escolherFotoDaGaleria, fotografarPrato } from '../src/utils/fotosRefeicao';
import { ErroFoto, diagnosticoFoto } from '../src/utils/erroFoto';

type Escolha = { tipo: string } | 'cancelar';
let escolha: Escolha;
let abre: boolean;
let temCanvas: boolean;
const g = globalThis as Record<string, unknown>;

beforeEach(() => {
  escolha = { tipo: 'image/jpeg' };
  abre = true;
  temCanvas = true;
  g.Image = class {
    src = '';
    naturalWidth = 1600;
    naturalHeight = 1200;
    decode() { return abre ? Promise.resolve() : Promise.reject(new Error('EncodingError: The source image cannot be decoded.')); }
  };
  g.URL = { createObjectURL: () => 'blob:http://exemplo/abc', revokeObjectURL: () => {} };
  g.document = {
    body: { appendChild: () => {} },
    createElement(nome: string) {
      if (nome === 'canvas') {
        return { width: 0, height: 0, getContext: () => (temCanvas ? { drawImage: () => {} } : null), toDataURL: () => 'data:image/jpeg;base64,QUJD' };
      }
      const ouvintes: Record<string, () => void> = {};
      const entrada = {
        type: '', accept: '', style: { display: '' }, files: null as unknown,
        addEventListener: (ev: string, fn: () => void) => { ouvintes[ev] = fn; },
        remove: () => {},
        click: () => {
          if (escolha === 'cancelar') return ouvintes.cancel();
          entrada.files = [{ type: escolha.tipo }];
          ouvintes.change();
        },
      };
      return entrada;
    },
  };
});

async function falha(acao: () => Promise<unknown>): Promise<ErroFoto> {
  try {
    await acao();
  } catch (e) {
    return e as ErroFoto;
  }
  throw new Error('deveria ter falhado');
}

describe('Galeria na PWA', () => {
  it('um JPEG gera a prévia reduzida', async () => {
    await expect(escolherFotoDaGaleria()).resolves.toEqual({ uri: 'data:image/jpeg;base64,QUJD' });
  });

  it('foto entregue SEM tipo pelo navegador ainda gera a prévia (antes era recusada)', async () => {
    escolha = { tipo: '' };
    await expect(escolherFotoDaGaleria()).resolves.toEqual({ uri: 'data:image/jpeg;base64,QUJD' });
  });

  it('foto entregue como application/octet-stream também gera a prévia', async () => {
    escolha = { tipo: 'application/octet-stream' };
    await expect(escolherFotoDaGaleria()).resolves.toEqual({ uri: 'data:image/jpeg;base64,QUJD' });
  });

  it('navegador não abre a imagem: etapa abrir, com o tipo', async () => {
    escolha = { tipo: 'image/heic' };
    abre = false;
    const e = await falha(() => escolherFotoDaGaleria());
    expect(e.etapa).toBe('abrir');
    expect(e.tipo).toBe('image/heic');
  });

  it('falha ao desenhar a prévia: etapa converter', async () => {
    temCanvas = false;
    expect((await falha(() => escolherFotoDaGaleria())).etapa).toBe('converter');
  });

  it('cancelar não mostra erro', async () => {
    escolha = 'cancelar';
    await expect(escolherFotoDaGaleria()).resolves.toBeNull();
  });
});

describe('Câmera na PWA', () => {
  it('seletor que recusa o arquivo: etapa selecionar', async () => {
    mockCamera.mockRejectedValue(new Error('Unsupported file type: . Only images and videos are supported.'));
    const e = await falha(() => fotografarPrato());
    expect(e.etapa).toBe('selecionar');
    expect(e.tipo).toBe('sem tipo');
  });
});

describe('diagnosticoFoto', () => {
  it('mostra só etapa, tipo e erro, sem endereço, caminho ou nome de arquivo', () => {
    const texto = diagnosticoFoto(
      new ErroFoto('converter', 'image/jpeg', new Error('falhou em blob:http://exemplo/abc e /storage/emulated/0/DCIM/IMG_segredo.jpg (foto da Maria.png) data:image/jpeg;base64,QUJD')),
    );
    expect(texto).toContain('etapa=converter');
    expect(texto).toContain('tipo=image/jpeg');
    expect(texto).not.toMatch(/blob:|data:|storage|DCIM|segredo|Maria|QUJD/);
  });
});
