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
    removeItem: jest.fn(async (k: string) => {
      delete mockArmazem[k];
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
import { analisarFotoDoPrato, darConsentimentoIA, revogarConsentimentoIA, temConsentimentoIA } from '../src/utils/iaPrato';

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

  test('revogar remove apenas a autorização e permite nova escolha', async () => {
    mockArmazem['levia:perfil'] = 'perfil fictício';
    mockArmazem['levia:licenca'] = 'licença fictícia';
    mockArmazem['levia:instalacao'] = 'instalação fictícia';
    await darConsentimentoIA();
    await revogarConsentimentoIA();
    expect(await temConsentimentoIA()).toBe(false);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('levia:consentimentoIA');
    expect(mockArmazem).toEqual({
      'levia:perfil': 'perfil fictício',
      'levia:licenca': 'licença fictícia',
      'levia:instalacao': 'instalação fictícia',
    });
    await darConsentimentoIA();
    expect(await temConsentimentoIA()).toBe(true);
  });

  test('falha ao revogar é reportada e não remove a autorização', async () => {
    await darConsentimentoIA();
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('falha fictícia'));
    await expect(revogarConsentimentoIA()).rejects.toThrow('falha fictícia');
    expect(await temConsentimentoIA()).toBe(true);
  });

  const LICENCA = 'v1.cargo-ficticio.assinatura-ficticia';
  const comLicenca = () => {
    mockArmazem['levia:licenca'] = JSON.stringify({ licenca: LICENCA, plano: 'teste', acessoAte: '2030-01-01T00:00:00.000Z' });
  };

  test('sem licença não chama o servidor e pede a ativação do serial', async () => {
    const r = await analisarFotoDoPrato('file:///ficticio.jpg', 'pt');
    expect(r).toEqual({ ok: false, motivo: 'licenca' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('se o servidor recusa a licença, ela é apagada para pedir o serial de novo', async () => {
    comLicenca();
    fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({ erro: 'licenca_revogada' }) });
    const r = await analisarFotoDoPrato('file:///ficticio.jpg', 'pt');
    expect(r).toEqual({ ok: false, motivo: 'licenca' });
    expect(mockArmazem['levia:licenca']).toBeUndefined();
  });

  test('acesso vencido e cota esgotada são avisos diferentes', async () => {
    comLicenca();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 402, json: async () => ({ erro: 'acesso_expirado' }) });
    expect(await analisarFotoDoPrato('file:///ficticio.jpg', 'pt')).toEqual({ ok: false, motivo: 'expirado' });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 402, json: async () => ({ erro: 'cota_esgotada', liberaEm: '2030-01-08T00:00:00.000Z' }) });
    expect(await analisarFotoDoPrato('file:///ficticio.jpg', 'pt')).toEqual({ ok: false, motivo: 'cota', liberaEm: '2030-01-08T00:00:00.000Z' });
    expect(mockArmazem['levia:licenca']).toBeDefined();
  });

  test('payload tem só imagem, instalacao, idioma e licença; resposta não salva nada', async () => {
    // dados de saúde fictícios existentes no armazenamento: não podem vazar
    mockArmazem['levia:perfil'] = JSON.stringify({ nome: 'Fulano Ficticio', peso: 80, glicemia: 100, medicamentos: ['X'] });
    comLicenca();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ehComida: true, itens: [itemFicticio], restantes: 3 }),
    });
    const antes = JSON.stringify(mockArmazem);

    const r = await analisarFotoDoPrato('file:///ficticio.jpg', 'pt');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(Object.keys(body).sort()).toEqual(['idioma', 'imagem', 'instalacao', 'licenca']);
    expect(body).toEqual({ imagem: mockBase64, instalacao: mockUuid, idioma: 'pt', licenca: LICENCA });
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
    expect(Object.keys(depois).sort()).toEqual(['levia:instalacao', 'levia:licenca', 'levia:perfil']);
    expect(JSON.stringify({ ...depois, 'levia:instalacao': undefined })).toBe(
      JSON.stringify({ ...JSON.parse(antes), 'levia:instalacao': undefined }),
    );
    expect((AsyncStorage.setItem as jest.Mock).mock.calls.map((c) => c[0])).toEqual(['levia:instalacao']);
  });
});
