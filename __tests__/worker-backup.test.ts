import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { cofre } from '@utils/cofre';
import { CHAVE_CABECALHO, CHAVE_SAL } from '@utils/cofreDados';
import { abrirBackupCifrado, aplicarBackup, escolherBackup, exportarBackup } from '@utils/backup';
import { decifrar } from '@utils/cifraBackup';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getAllKeys: jest.fn(), multiGet: jest.fn(), multiRemove: jest.fn(), multiSet: jest.fn(),
}));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('@utils/web', () => ({ baixarArquivo: jest.fn() }));
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'cache/', writeAsStringAsync: jest.fn(), readAsStringAsync: jest.fn(),
}));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(async () => true), shareAsync: jest.fn() }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-constants', () => ({ expoConfig: { version: 'teste' } }));
jest.mock('@utils/glp1Notifications', () => ({ getNotifications: () => null }));
jest.mock('@utils/bloqueioSuspenso', () => ({ suspenderBloqueio: jest.fn() }));
jest.mock('expo-crypto', () => ({ getRandomBytes: jest.fn() }));
jest.mock('@utils/cifraBackup', () => ({ cifrar: jest.fn(), decifrar: jest.fn() }));
jest.mock('@utils/cofre', () => ({
  cofre: { temCofre: jest.fn(), estaDesbloqueado: jest.fn(), lerDado: jest.fn(), gravarDado: jest.fn() },
}));
jest.mock('@utils/cofreDados', () => ({
  CHAVE_CABECALHO: 'levia:cofre:v2', CHAVE_SAL: 'levia:cifra:sal',
  ehSensivel: (chave: string) => chave === 'levia:userProfile',
}));

const storage = jest.mocked(AsyncStorage);
const vault = jest.mocked(cofre);
const antigo = {
  [CHAVE_CABECALHO]: 'cabeçalho antigo',
  [CHAVE_SAL]: 'sal antigo',
  'levia:licenca': 'licença antiga',
  'levia:seguranca': 'segurança antiga',
  'levia:userProfile': 'perfil novo',
  'levia:tema': 'escuro',
  'levia:invalido': 42,
  'outra:chave': 'externo',
};

beforeEach(() => {
  jest.resetAllMocks();
  storage.getAllKeys.mockResolvedValue([CHAVE_CABECALHO, CHAVE_SAL, 'levia:licenca', 'levia:seguranca', 'levia:userProfile', 'levia:tema']);
  vault.temCofre.mockResolvedValue(true);
  vault.estaDesbloqueado.mockReturnValue(true);
});

test('exportação não inclui cabeçalho, sal, licença ou segurança', async () => {
  storage.multiGet.mockResolvedValue([['levia:userProfile', 'cifrado'], ['levia:tema', 'claro']]);
  vault.lerDado.mockResolvedValue('perfil aberto');
  await exportarBackup('backup');
  expect(storage.multiGet).toHaveBeenCalledWith(['levia:userProfile', 'levia:tema']);
  const arquivo = JSON.parse(jest.mocked(FileSystem.writeAsStringAsync).mock.calls[0][1]);
  expect(arquivo.dados).toEqual({ 'levia:userProfile': 'perfil aberto', 'levia:tema': 'claro' });
});

test('backups antigos, abertos ou cifrados, são filtrados', async () => {
  jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'cache/backup', name: 'backup' }] });
  jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue(JSON.stringify({ app: 'levia', formato: 1, dados: antigo }));
  expect(await escolherBackup()).toMatchObject({ ok: true, dados: { 'levia:userProfile': 'perfil novo', 'levia:tema': 'escuro' } });
  jest.mocked(decifrar).mockResolvedValue(JSON.stringify(antigo));
  expect(await abrirBackupCifrado({} as any, 'senha')).toEqual({ 'levia:userProfile': 'perfil novo', 'levia:tema': 'escuro' });
});

test('aplicação revalida os dados e preserva o cabeçalho e a segurança atuais', async () => {
  await aplicarBackup(antigo);
  expect(storage.multiRemove).toHaveBeenCalledWith(['levia:userProfile', 'levia:tema']);
  expect(storage.multiSet).toHaveBeenCalledWith([['levia:tema', 'escuro'], ['levia:reagendarLembretes', '1']]);
  expect(vault.gravarDado).toHaveBeenCalledTimes(1);
  expect(vault.gravarDado).toHaveBeenCalledWith('levia:userProfile', 'perfil novo');
});

test.each([[false, false], [false, true], [true, false]])(
  'recusa sem escrita quando cofre existe=%s e desbloqueado=%s',
  async (existe, desbloqueado) => {
    vault.temCofre.mockResolvedValue(existe);
    vault.estaDesbloqueado.mockReturnValue(desbloqueado);
    await expect(aplicarBackup(antigo)).rejects.toThrow();
    expect(storage.multiRemove).not.toHaveBeenCalled();
    expect(storage.multiSet).not.toHaveBeenCalled();
    expect(vault.gravarDado).not.toHaveBeenCalled();
  },
);

test.each([null, [], 'inválido'])('recusa argumento inválido sem escrever: %s', async (dados) => {
  await expect(aplicarBackup(dados)).rejects.toThrow();
  expect(storage.multiRemove).not.toHaveBeenCalled();
  expect(storage.multiSet).not.toHaveBeenCalled();
  expect(vault.gravarDado).not.toHaveBeenCalled();
});
