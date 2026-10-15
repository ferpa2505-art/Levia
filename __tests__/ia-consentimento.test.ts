/**
 * Fluxo de consentimento da análise por IA — somente dados fictícios.
 * AsyncStorage, expo-crypto, expo-image-manipulator e fetch são mockados.
 */

const mockArmazem: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => (k in mockArmazem ? mockArmazem[k] : null)),
    setItem: jest.fn(async (k: string, v: string) => {
      mockArmazem[k] = v;
    }),
  },
}));

const mockUuid = '00000000-0000-4000-8000-000000000000';
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => '00000000-0000-4000-8000-000000000000') }));

const mockBase64 = 'QkFTRTY0LUZJQ1RJQ0lP';
jest.mock('expo-image-manipulator', () => {
  const imagem = { width: 4000, height: 3000, saveAsync: jest.fn(async () => ({ base64: 'QkFTRTY0LUZJQ1RJQ0lP' })) };
  const ctx = { renderAsync: jest.fn(async () => imagem), resize: jest.fn() };
  return {
    ImageManipulator: { manipulate: jest.fn(() => ctx) },
    SaveFormat: { JPEG: 'jpeg' },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { analisarFotoDoPrato, darConsentimentoIA, temConsentimentoIA } from '../src/utils/iaPrato';

const itemFicticio = {
  nome: 'Alimento fictício xyzzy',
  nomeIngles: '',
  unidades: 1,
  gramas: 100,
  confianca: 0.9,
  por100g: { kcal: 100, proteina: 5, carboidrato: 10, gordura: 2, fibra: 1 },
};

describe('Consentimento e análise por IA (dados fictícios)', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    Object.keys(mockArmazem).forEach((k) => delete mockArmazem[k]);
    jest.clearAllMocks();
    (global as any).fetch = fetchMock;
  });

  test('sem consentimento retorna false; após darConsentimentoIA retorna true', async () => {
    expect(await temConsentimentoIA()).toBe(false);
    await darConsentimentoIA();
    expect(await temConsentimentoIA()).toBe(true);
  });

  test('payload tem só imagem, instalacao e idioma; resposta não salva nada', async () => {
    // dados de saúde fictícios existentes no armazenamento: não podem vazar
    mockArmazem['levia:perfil'] = JSON.stringify({ nome: 'Fulano Ficticio', peso: 80, glicemia: 100, medicamentos: ['X'] });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ehComida: true, itens: [itemFicticio], restantes: 3 }),
    });
    const antes = JSON.stringify(mockArmazem);

    const r = await analisarFotoDoPrato('file:///ficticio.jpg', 'pt');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(Object.keys(body).sort()).toEqual(['idioma', 'imagem', 'instalacao']);
    expect(body).toEqual({ imagem: mockBase64, instalacao: mockUuid, idioma: 'pt' });
    const texto = fetchMock.mock.calls[0][1].body as string;
    for (const proibido of ['Fulano', 'peso', 'glicemia', 'medicamentos', 'perfil']) {
      expect(texto).not.toContain(proibido);
    }

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.restantes).toBe(3);
      expect(r.sugestoes).toHaveLength(1);
      expect(r.sugestoes[0].gramas).toBe(100);
    }

    // só a instalação (UUID) foi gravada; nenhuma refeição/registro salvo antes da confirmação
    const depois = JSON.parse(JSON.stringify(mockArmazem));
    expect(Object.keys(depois).sort()).toEqual(['levia:instalacao', 'levia:perfil']);
    expect(JSON.stringify({ ...depois, 'levia:instalacao': undefined })).toBe(
      JSON.stringify({ ...JSON.parse(antes), 'levia:instalacao': undefined }),
    );
    expect((AsyncStorage.setItem as jest.Mock).mock.calls.map((c) => c[0])).toEqual(['levia:instalacao']);
  });
});
