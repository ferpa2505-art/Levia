/** Helpers de criptografia compartilhados (Web Crypto, sem dependências). */

/** Comparação em tempo constante (não vaza em qual caractere a diferença está). */
export function iguais(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diferente = 0;
  for (let i = 0; i < a.length; i++) diferente |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferente === 0;
}

export function base64url(bytes) {
  let texto = '';
  for (const byte of bytes) texto += String.fromCharCode(byte);
  return btoa(texto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64urlParaTexto(valor) {
  const padded = valor.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0)));
}

const hex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function sha256(texto) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)));
}

export async function hmacHex(segredo, texto) {
  const chave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(segredo),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(texto)));
}
