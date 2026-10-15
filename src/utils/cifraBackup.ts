import { gcm } from '@noble/ciphers/aes';
import { scryptAsync } from '@noble/hashes/scrypt';
import { utf8ToBytes } from '@noble/hashes/utils';
import { bytesToUtf8 } from '@noble/ciphers/utils';

/**
 * Criptografia opcional do arquivo de backup (dados de saúde viajam por
 * WhatsApp, Drive, e-mail). AES-256-GCM com chave derivada da senha por
 * scrypt — sem a senha o arquivo é ilegível, e qualquer alteração é detectada.
 */

export interface DadosCifrados {
  alg: 'aes-256-gcm';
  kdf: 'scrypt';
  N: number;
  r: number;
  p: number;
  sal: string;
  iv: string;
  texto: string;
}

// N = 2^15: ~1–2 s num celular comum — lento de propósito, para atrasar quem tenta adivinhar a senha
const PARAMS = { N: 2 ** 15, r: 8, p: 1 };

// base64 próprio: não depende de btoa/atob existirem no motor JS do celular
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function paraBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += ALFABETO[(n >> 18) & 63] + ALFABETO[(n >> 12) & 63];
    out += i + 1 < bytes.length ? ALFABETO[(n >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? ALFABETO[n & 63] : '=';
  }
  return out;
}

function deBase64(b64: string): Uint8Array {
  const limpo = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((limpo.length * 3) / 4));
  let bits = 0;
  let acc = 0;
  let k = 0;
  for (const c of limpo) {
    acc = (acc << 6) | ALFABETO.indexOf(c);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[k++] = (acc >> bits) & 255;
    }
  }
  return out.subarray(0, k);
}

async function chave(senha: string, sal: Uint8Array, p: { N: number; r: number; p: number }) {
  return scryptAsync(utf8ToBytes(senha.normalize('NFKC')), sal, { ...p, dkLen: 32 });
}

/** `aleatorio(n)` vem de fora (expo-crypto no app, crypto do Node nos testes) */
export async function cifrar(texto: string, senha: string, aleatorio: (n: number) => Uint8Array): Promise<DadosCifrados> {
  const sal = aleatorio(16);
  const iv = aleatorio(12);
  const k = await chave(senha, sal, PARAMS);
  const cifrado = gcm(k, iv).encrypt(utf8ToBytes(texto));
  return { alg: 'aes-256-gcm', kdf: 'scrypt', ...PARAMS, sal: paraBase64(sal), iv: paraBase64(iv), texto: paraBase64(cifrado) };
}

/** Devolve o texto original, ou null se a senha estiver errada / arquivo alterado */
export async function decifrar(d: DadosCifrados, senha: string): Promise<string | null> {
  if (d.alg !== 'aes-256-gcm' || d.kdf !== 'scrypt') return null;
  // limites para um arquivo malicioso não travar o celular
  if (!(d.N >= 2 ** 10 && d.N <= 2 ** 17 && d.r >= 1 && d.r <= 16 && d.p >= 1 && d.p <= 4)) return null;
  try {
    const k = await chave(senha, deBase64(d.sal), { N: d.N, r: d.r, p: d.p });
    const aberto = gcm(k, deBase64(d.iv)).decrypt(deBase64(d.texto));
    return bytesToUtf8(aberto);
  } catch {
    return null;
  }
}
