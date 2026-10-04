import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Senha do app (4 a 10 dígitos) e desbloqueio por biometria.
 *
 * A senha nunca é guardada como foi digitada: guardamos só um hash SHA-256
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

async function hash(pin: string, sal: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${sal}:${pin}`);
}

export async function temSenha(): Promise<boolean> {
  return !!(await SecureStore.getItemAsync(CHAVE_PIN).catch(() => null));
}

export async function salvarSenha(pin: string) {
  if (!pinValido(pin)) throw new Error('senha inválida');
  const bytes = Crypto.getRandomBytes(16);
  const sal = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(CHAVE_PIN, JSON.stringify({ sal, hash: await hash(pin, sal), tam: pin.length }));
}

/** Quantidade de dígitos da senha (para desbloquear sem precisar tocar em OK) */
export async function tamanhoSenha(): Promise<number | null> {
  try {
    const salvo = await SecureStore.getItemAsync(CHAVE_PIN);
    return salvo ? (JSON.parse(salvo).tam ?? null) : null;
  } catch {
    return null;
  }
}

export async function conferirSenha(pin: string): Promise<boolean> {
  const salvo = await SecureStore.getItemAsync(CHAVE_PIN).catch(() => null);
  if (!salvo) return false;
  try {
    const { sal, hash: esperado } = JSON.parse(salvo) as { sal: string; hash: string };
    return (await hash(pin, sal)) === esperado;
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
