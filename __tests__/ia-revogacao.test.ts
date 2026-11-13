/** Revogação local: dados sintéticos, sem enviar imagem ou fazer rede. */
const mockArmazem: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => (k in mockArmazem ? mockArmazem[k] : null)),
    setItem: jest.fn(async (k: string, v: string) => { mockArmazem[k] = v; }),
    removeItem: jest.fn(async (k: string) => { delete mockArmazem[k]; }),
  },
}));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => '00000000-0000-4000-8000-000000000000') }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { darConsentimentoIA, revogarConsentimentoIA, temConsentimentoIA } from '../src/utils/iaPrato';

describe('Revogação do consentimento de IA', () => {
  beforeEach(() => {
    Object.keys(mockArmazem).forEach((k) => delete mockArmazem[k]);
    jest.clearAllMocks();
  });

  test('remove apenas o consentimento e preserva os dados locais e a licença', async () => {
    mockArmazem['levia:perfil'] = 'perfil fictício';
    mockArmazem['levia:refeicoes'] = 'refeições fictícias';
    mockArmazem['levia:licenca'] = 'licença fictícia';
    mockArmazem['levia:instalacao'] = 'instalação fictícia';
    await darConsentimentoIA();
    expect(await temConsentimentoIA()).toBe(true);

    await revogarConsentimentoIA();
    expect(await temConsentimentoIA()).toBe(false);
    expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('levia:consentimentoIA');
    expect(mockArmazem).toEqual({
      'levia:perfil': 'perfil fictício',
      'levia:refeicoes': 'refeições fictícias',
      'levia:licenca': 'licença fictícia',
      'levia:instalacao': 'instalação fictícia',
    });
  });

  test('pode revogar mesmo sem consentimento e aceitar novamente', async () => {
    await revogarConsentimentoIA();
    expect(await temConsentimentoIA()).toBe(false);
    await darConsentimentoIA();
    expect(await temConsentimentoIA()).toBe(true);
  });

  test('não informa sucesso quando a remoção falha', async () => {
    await darConsentimentoIA();
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('falha fictícia'));
    await expect(revogarConsentimentoIA()).rejects.toThrow('falha fictícia');
    expect(await temConsentimentoIA()).toBe(true);
  });
});
