import { gcm } from '@noble/ciphers/aes';
import { bytesToUtf8 } from '@noble/ciphers/utils';
import { scryptAsync } from '@noble/hashes/scrypt';
import { utf8ToBytes } from '@noble/hashes/utils';
import { deBase64, paraBase64 } from '@utils/cifraBackup';

/**
 * Cofre dos dados de saúde no aparelho.
 *
 * Cada valor sensível é gravado como envelope AES-256-GCM. A chave sai da senha do app (PIN)
 * por scrypt, com um sal por instalação. A chave fica só na memória enquanto o app está
 * desbloqueado.
 *
 * Regras:
 * - Antes de existir cofre (nenhum PIN criado ainda, sem sal), os dados ficam em texto puro:
 *   é a fase de onboarding. Ao criar o PIN, o desbloqueio cifra tudo.
 * - Depois que o cofre existe, com o app bloqueado ler ou gravar um dado sensível falha.
 *   Assim um contexto nunca grava um vazio por cima dos dados reais.
 *
 * O núcleo recebe o armazenamento e o gerador aleatório de fora, para ser testado em Node.
 */

export const PREFIXO_ENVELOPE = 'LEVIA-ENC1:';
/** Chaves que contêm dados de saúde ou de perfil e passam pelo cofre */
export const CHAVES_SENSIVEIS = [
  'levia:diabetes',
  'levia:glp1',
  'levia:records',
  'levia:medicacoes',
  'levia:userProfile',
  'levia:fitness',
  'levia:fitness:v2',
  'levia:custom_recipes',
] as const;
export const CHAVE_SAL = 'levia:cifra:sal';

// mesmo custo do backup cifrado: lento de propósito para quem tenta adivinhar o PIN
export const SCRYPT_DADOS = { N: 2 ** 15, r: 8, p: 1 };

export type Aleatorio = (n: number) => Uint8Array;

export interface ArmazenamentoBruto {
  getItem(chave: string): Promise<string | null>;
  setItem(chave: string, valor: string): Promise<void>;
  multiSet(pares: [string, string][]): Promise<void>;
  removeItem(chave: string): Promise<void>;
}

export class CofreBloqueado extends Error {
  constructor() {
    super('cofre de dados bloqueado');
    this.name = 'CofreBloqueado';
  }
}

export function ehSensivel(chave: string): boolean {
  return (CHAVES_SENSIVEIS as readonly string[]).includes(chave);
}

export function estaCifrado(valor: string): boolean {
  return valor.startsWith(PREFIXO_ENVELOPE);
}

export async function derivarChave(pin: string, sal: Uint8Array, p = SCRYPT_DADOS): Promise<Uint8Array> {
  return scryptAsync(utf8ToBytes(pin.normalize('NFKC')), sal, { ...p, dkLen: 32 });
}

export function cifrarTexto(texto: string, chave: Uint8Array, aleatorio: Aleatorio): string {
  const iv = aleatorio(12);
  const cifrado = gcm(chave, iv).encrypt(utf8ToBytes(texto));
  return `${PREFIXO_ENVELOPE}${paraBase64(iv)}.${paraBase64(cifrado)}`;
}

/** Devolve o texto, ou null se o envelope não abre com esta chave (senha errada ou dado alterado). */
export function decifrarTexto(envelope: string, chave: Uint8Array): string | null {
  if (!estaCifrado(envelope)) return null;
  const partes = envelope.slice(PREFIXO_ENVELOPE.length).split('.');
  if (partes.length !== 2) return null;
  try {
    return bytesToUtf8(gcm(chave, deBase64(partes[0])).decrypt(deBase64(partes[1])));
  } catch {
    return null;
  }
}

export interface Cofre {
  estaDesbloqueado(): boolean;
  /** true depois que o aparelho tem um sal, ou seja, depois do primeiro PIN */
  temCofre(): Promise<boolean>;
  /** Abre o cofre com o PIN. Cria o sal na primeira vez e cifra o que estiver em texto puro. */
  desbloquear(pin: string): Promise<void>;
  /** Abre o cofre com a chave já derivada (biometria). Falha se a chave não abre os dados. */
  desbloquearComChave(chave: Uint8Array): Promise<void>;
  /** Chave atual, para guardar no cofre do sistema (biometria). null se bloqueado. */
  obterChave(): Uint8Array | null;
  bloquear(): void;
  lerDado(chave: string): Promise<string | null>;
  gravarDado(chave: string, valor: string): Promise<void>;
  /** Troca o PIN: relê tudo com a chave antiga e regrava com a nova, em uma única gravação. */
  trocarPin(pinNovo: string): Promise<void>;
  /** Avisa quando o cofre abre ou fecha. Devolve a função para parar de ouvir. */
  ouvir(fn: (desbloqueado: boolean) => void): () => void;
}

export function criarCofre(opcoes: {
  armazenamento: ArmazenamentoBruto;
  aleatorio: Aleatorio;
  scrypt?: typeof SCRYPT_DADOS;
}): Cofre {
  const { armazenamento, aleatorio } = opcoes;
  const p = opcoes.scrypt ?? SCRYPT_DADOS;
  let chave: Uint8Array | null = null;
  const ouvintes = new Set<(d: boolean) => void>();

  function avisar() {
    for (const fn of ouvintes) fn(chave !== null);
  }

  async function salAtual(): Promise<Uint8Array | null> {
    const sal = await armazenamento.getItem(CHAVE_SAL);
    return sal ? deBase64(sal) : null;
  }

  async function migrarTextoPuro(k: Uint8Array) {
    const pares: [string, string][] = [];
    for (const c of CHAVES_SENSIVEIS) {
      const bruto = await armazenamento.getItem(c);
      if (bruto !== null && !estaCifrado(bruto)) pares.push([c, cifrarTexto(bruto, k, aleatorio)]);
    }
    if (pares.length) await armazenamento.multiSet(pares);
  }

  async function conferirAmostra(k: Uint8Array) {
    for (const c of CHAVES_SENSIVEIS) {
      const v = await armazenamento.getItem(c);
      if (v !== null && estaCifrado(v)) {
        if (decifrarTexto(v, k) === null) throw new CofreBloqueado();
        return;
      }
    }
  }

  return {
    estaDesbloqueado: () => chave !== null,

    async temCofre() {
      return (await salAtual()) !== null;
    },

    async desbloquear(pin) {
      let sal = await salAtual();
      const primeira = sal === null;
      if (primeira) {
        sal = aleatorio(16);
        await armazenamento.setItem(CHAVE_SAL, paraBase64(sal));
      }
      const k = await derivarChave(pin, sal!, p);
      if (!primeira) await conferirAmostra(k);
      chave = k;
      await migrarTextoPuro(k);
      avisar();
    },

    async desbloquearComChave(k) {
      if (!(await salAtual())) throw new CofreBloqueado();
      await conferirAmostra(k);
      chave = k;
      await migrarTextoPuro(k);
      avisar();
    },

    obterChave: () => chave,

    bloquear() {
      if (chave === null) return;
      chave = null;
      avisar();
    },

    async lerDado(c) {
      if (!ehSensivel(c)) return armazenamento.getItem(c);
      const bruto = await armazenamento.getItem(c);
      if (bruto === null) return null;
      if (!estaCifrado(bruto)) {
        // texto puro: aceito com o cofre aberto (migra no próximo desbloqueio) ou antes de o cofre existir
        if (chave === null && (await salAtual())) throw new CofreBloqueado();
        return bruto;
      }
      if (chave === null) throw new CofreBloqueado();
      const aberto = decifrarTexto(bruto, chave);
      if (aberto === null) throw new CofreBloqueado();
      return aberto;
    },

    async gravarDado(c, valor) {
      if (!ehSensivel(c)) return armazenamento.setItem(c, valor);
      if (chave === null) {
        if (await salAtual()) throw new CofreBloqueado();
        return armazenamento.setItem(c, valor); // onboarding: migrado quando o PIN for criado
      }
      await armazenamento.setItem(c, cifrarTexto(valor, chave, aleatorio));
    },

    async trocarPin(pinNovo) {
      if (chave === null) throw new CofreBloqueado();
      const antiga = chave;
      const sal = aleatorio(16);
      const nova = await derivarChave(pinNovo, sal, p);
      const pares: [string, string][] = [[CHAVE_SAL, paraBase64(sal)]];
      for (const c of CHAVES_SENSIVEIS) {
        const bruto = await armazenamento.getItem(c);
        if (bruto === null) continue;
        const texto = estaCifrado(bruto) ? decifrarTexto(bruto, antiga) : bruto;
        if (texto === null) throw new CofreBloqueado();
        pares.push([c, cifrarTexto(texto, nova, aleatorio)]);
      }
      // uma gravação só: ou tudo muda para a nova chave, ou nada muda
      await armazenamento.multiSet(pares);
      chave = nova;
    },

    ouvir(fn) {
      ouvintes.add(fn);
      return () => { ouvintes.delete(fn); };
    },
  };
}
