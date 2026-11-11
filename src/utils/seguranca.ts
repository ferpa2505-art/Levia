import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { scryptAsync } from '@noble/hashes/scrypt';
import { utf8ToBytes } from '@noble/hashes/utils';
import { deBase64, paraBase64 } from '@utils/cifraBackup';

/**
 * No celular a senha fica no cofre do sistema (SecureStore). No navegador (PWA)
 * esse cofre não existe, então o hash da senha fica no armazenamento do próprio
 * app — os dados de saúde já ficam lá também; a senha continua guardada só como hash.
 */
const cofre = Platform.OS === 'web'
  ? {
      getItemAsync: (k: string) => AsyncStorage.getItem(k),
      setItemAsync: (k: string, v: string) => AsyncStorage.setItem(k, v),
      deleteItemAsync: (k: string) => AsyncStorage.removeItem(k),
    }
  : SecureStore;

/**
 * Senha do app (4 a 10 dígitos) e desbloqueio por biometria.
 *
 * A senha nunca é guardada como foi digitada: guardamos só um hash (scrypt)
 * com "sal" aleatório, no armazenamento seguro do Android (Keystore). A
 * biometria é verificada pelo próprio sistema — o app não tem acesso à
 * digital nem ao rosto, só recebe "deu certo" ou "não deu".
 */
const CHAVE_PIN = 'levia_pin';
const CHAVE_CONFIG = 'levia:seguranca';

export const PIN_MIN = 4;
export const PIN_MAX = 10;
/** Tentativas erradas seguidas antes de esperar */
export const MAX_TENTATIVAS = 5;
export const ESPERA_BLOQUEIO_MS = 30_000;

export interface ConfigSeguranca {
  biometria: boolean;
  /** Segundos fora do app antes de pedir a senha de novo (0 = sempre) */
  bloquearAposSeg: number;
  relatorioSemanal: boolean;
  relatorioMensal: boolean;
  relatorioIds?: string[];
}

export const configSegurancaPadrao: ConfigSeguranca = {
  biometria: false,
  bloquearAposSeg: 30,
  relatorioSemanal: true,
  relatorioMensal: true,
};

export const OPCOES_BLOQUEIO = [0, 30, 60, 300];

export function pinValido(pin: string) {
  return new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(pin);
}

/** Formato antigo (v1): SHA-256 simples. Só é lido para migrar para o scrypt no primeiro desbloqueio. */
async function hashLegado(pin: string, sal: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${sal}:${pin}`);
}

// scrypt deixa cada tentativa cara (uma senha de poucos dígitos nunca será à prova de quem
// copia o armazenamento do aparelho, mas isso tira a quebra instantânea do SHA-256 puro)
const SCRYPT = { N: 2 ** 14, r: 8, p: 1, dkLen: 32 };

async function hash(pin: string, sal: string) {
  const bytes = await scryptAsync(utf8ToBytes(pin), utf8ToBytes(sal), SCRYPT);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Comparação em tempo constante */
function iguais(a: string, b: string) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function temSenha(): Promise<boolean> {
  return !!(await cofre.getItemAsync(CHAVE_PIN).catch(() => null));
}

export async function salvarSenha(pin: string) {
  if (!pinValido(pin)) throw new Error('senha inválida');
  const bytes = Crypto.getRandomBytes(16);
  const sal = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await cofre.setItemAsync(CHAVE_PIN, JSON.stringify({ v: 2, sal, hash: await hash(pin, sal), tam: pin.length }));
}

/** Quantidade de dígitos da senha (para desbloquear sem precisar tocar em OK) */
export async function tamanhoSenha(): Promise<number | null> {
  try {
    const salvo = await cofre.getItemAsync(CHAVE_PIN);
    return salvo ? (JSON.parse(salvo).tam ?? null) : null;
  } catch {
    return null;
  }
}

export async function conferirSenha(pin: string): Promise<boolean> {
  const salvo = await cofre.getItemAsync(CHAVE_PIN).catch(() => null);
  if (!salvo) return false;
  try {
    const { v, sal, hash: esperado } = JSON.parse(salvo) as { v?: number; sal: string; hash: string };
    if (v === 2) return iguais(await hash(pin, sal), esperado);
    // senha criada antes do scrypt: confere do jeito antigo e já regrava no formato novo
    if (!iguais(await hashLegado(pin, sal), esperado)) return false;
    await salvarSenha(pin).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export async function carregarConfigSeguranca(): Promise<ConfigSeguranca> {
  try {
    const raw = await AsyncStorage.getItem(CHAVE_CONFIG);
    return raw ? { ...configSegurancaPadrao, ...JSON.parse(raw) } : configSegurancaPadrao;
  } catch {
    return configSegurancaPadrao;
  }
}

export async function salvarConfigSeguranca(c: ConfigSeguranca) {
  await AsyncStorage.setItem(CHAVE_CONFIG, JSON.stringify(c)).catch(() => {});
}

export type TipoBiometria = 'digital' | 'rosto' | 'digital_rosto' | null;

/** Qual biometria o aparelho oferece e já tem cadastrada (null = nenhuma) */
export async function biometriaDisponivel(): Promise<TipoBiometria> {
  try {
    if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) return null;
    const tipos = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const digital = tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    const rosto = tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    return digital && rosto ? 'digital_rosto' : rosto ? 'rosto' : digital ? 'digital' : null;
  } catch {
    return null;
  }
}

export async function autenticarBiometria(mensagem: string, cancelar: string): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: mensagem,
      cancelLabel: cancelar,
      disableDeviceFallback: true,
      // 'weak' inclui o desbloqueio facial dos aparelhos que não têm câmera 3D
      biometricsSecurityLevel: 'weak',
    });
    return r.success;
  } catch {
    return false;
  }
}

/* ---------- chave do cofre guardada para a biometria (só no celular) ---------- */

const CHAVE_COFRE_BIO = 'levia_cofre_bio';

/**
 * Guarda a chave do cofre no cofre do sistema, liberada só pela biometria. Assim o app desbloqueia
 * por digital/rosto sem o PIN, e o "esqueci" consegue trocar o PIN sem perder os dados.
 * No navegador (PWA) não há biometria: não guarda nada.
 */
export async function guardarChaveBiometria(chave: Uint8Array | null): Promise<void> {
  if (Platform.OS === 'web' || !chave) return;
  await SecureStore.setItemAsync(CHAVE_COFRE_BIO, paraBase64(chave), {
    requireAuthentication: true,
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/** Chave do cofre, depois da biometria. null se cancelou, falhou ou não há chave guardada. */
export async function lerChaveBiometria(mensagem: string): Promise<Uint8Array | null> {
  if (Platform.OS === 'web') return null;
  try {
    const guardada = await SecureStore.getItemAsync(CHAVE_COFRE_BIO, {
      requireAuthentication: true,
      authenticationPrompt: mensagem,
    });
    return guardada ? deBase64(guardada) : null;
  } catch {
    return null;
  }
}

export async function apagarChaveBiometria(): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(CHAVE_COFRE_BIO).catch(() => {});
}
