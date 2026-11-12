import { gcm } from '@noble/ciphers/aes';
import { bytesToUtf8 } from '@noble/ciphers/utils';
import { argon2idAsync } from '@noble/hashes/argon2';
import { scryptAsync } from '@noble/hashes/scrypt';
import { utf8ToBytes } from '@noble/hashes/utils';
import { deBase64, paraBase64 } from '@utils/cifraBackup';

/**
 * Cofre dos dados de saúde no aparelho (formato v2). Modelo de ameaça completo em docs/SEGURANCA_COFRE.md.
 *
 * Cada valor sensível é um envelope AES-256-GCM sob uma CHAVE DE DADOS (DEK) aleatória de 256 bits, gerada no
 * aparelho. O nome da chave de armazenamento entra como dado autenticado (AAD): um envelope copiado para outra
 * chave deixa de abrir. A DEK nunca é gravada em claro; ela fica "embrulhada" (cifrada) em slots:
 *
 * - slot "sistema" (celular): a DEK é embrulhada por uma chave aleatória guardada no cofre do sistema
 *   (Android Keystore / iOS Keychain, via SecureStore). Copiar o armazenamento do app (backup, adb, outro app)
 *   não basta para abrir os dados, e o PIN deixa de ser a raiz criptográfica: vira só a trava do app.
 * - slot "senha" (navegador/PWA, que não tem cofre do sistema): a DEK é embrulhada por uma chave derivada da
 *   senha com Argon2id. Aqui a proteção contra cópia do armazenamento depende da entropia da senha: um PIN
 *   numérico curto continua quebrável offline, por mais caro que seja o KDF.
 *
 * Não protege contra aparelho desbloqueado com o app aberto, malware com acesso root/ao Keystore, nem contra
 * quem já tem a senha. O núcleo recebe armazenamento, aleatório e provedor do sistema de fora (testável em Node).
 *
 * Migração: o formato v1 (chave = scrypt(PIN), envelope LEVIA-ENC1) é lido e convertido para v2 no primeiro
 * desbloqueio, em uma única gravação (multiSet), depois de reabrir cada valor em memória: se qualquer valor não
 * abrir, nada é gravado e os dados antigos ficam intactos.
 */

export const PREFIXO_ENVELOPE = 'LEVIA-ENC1:'; // formato v1 (só leitura, para migrar)
export const PREFIXO_ENVELOPE_V2 = 'LEVIA-ENC2:';
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
export const CHAVE_SAL = 'levia:cifra:sal'; // v1
export const CHAVE_CABECALHO = 'levia:cofre:v2';

// v1 (só para abrir cofres antigos e migrar): mesmo custo do backup cifrado
export const SCRYPT_DADOS = { N: 2 ** 15, r: 8, p: 1 };
// v2 no navegador: Argon2id, memória-dura. Os parâmetros ficam no cabeçalho de cada slot e podem subir depois.
export const ARGON2_WEB = { m: 32768, t: 3, p: 1 }; // 32 MiB, 3 passadas

export type Aleatorio = (n: number) => Uint8Array;

export interface ArmazenamentoBruto {
  getItem(chave: string): Promise<string | null>;
  setItem(chave: string, valor: string): Promise<void>;
  multiSet(pares: [string, string][]): Promise<void>;
  removeItem(chave: string): Promise<void>;
}

/** Chave aleatória guardada pelo sistema (Keystore/Keychain). Só existe no celular. */
export interface ProvedorChaveSistema {
  ler(): Promise<Uint8Array | null>;
  gravar(chave: Uint8Array): Promise<void>;
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
  return valor.startsWith(PREFIXO_ENVELOPE) || valor.startsWith(PREFIXO_ENVELOPE_V2);
}

export async function derivarChave(pin: string, sal: Uint8Array, p = SCRYPT_DADOS): Promise<Uint8Array> {
  return scryptAsync(utf8ToBytes(pin.normalize('NFKC')), sal, { ...p, dkLen: 32 });
}

export async function derivarChaveArgon2(senha: string, sal: Uint8Array, p = ARGON2_WEB): Promise<Uint8Array> {
  return argon2idAsync(utf8ToBytes(senha.normalize('NFKC')), sal, { ...p, dkLen: 32 });
}

/** v1: sem AAD. Mantido para ler cofres antigos. */
export function cifrarTexto(texto: string, chave: Uint8Array, aleatorio: Aleatorio): string {
  const iv = aleatorio(12);
  const cifrado = gcm(chave, iv).encrypt(utf8ToBytes(texto));
  return `${PREFIXO_ENVELOPE}${paraBase64(iv)}.${paraBase64(cifrado)}`;
}

/** Devolve o texto, ou null se o envelope v1 não abre com esta chave (senha errada ou dado alterado). */
export function decifrarTexto(envelope: string, chave: Uint8Array): string | null {
  if (!envelope.startsWith(PREFIXO_ENVELOPE)) return null;
  const partes = envelope.slice(PREFIXO_ENVELOPE.length).split('.');
  if (partes.length !== 2) return null;
  try {
    return bytesToUtf8(gcm(chave, deBase64(partes[0])).decrypt(deBase64(partes[1])));
  } catch {
    return null;
  }
}

/** v2: o nome da chave de armazenamento é dado autenticado (AAD). */
export function cifrarTextoV2(texto: string, chave: Uint8Array, aad: string, aleatorio: Aleatorio): string {
  const iv = aleatorio(12);
  const cifrado = gcm(chave, iv, utf8ToBytes(aad)).encrypt(utf8ToBytes(texto));
  return `${PREFIXO_ENVELOPE_V2}${paraBase64(iv)}.${paraBase64(cifrado)}`;
}

export function decifrarTextoV2(envelope: string, chave: Uint8Array, aad: string): string | null {
  if (!envelope.startsWith(PREFIXO_ENVELOPE_V2)) return null;
  const partes = envelope.slice(PREFIXO_ENVELOPE_V2.length).split('.');
  if (partes.length !== 2) return null;
  try {
    return bytesToUtf8(gcm(chave, deBase64(partes[0]), utf8ToBytes(aad)).decrypt(deBase64(partes[1])));
  } catch {
    return null;
  }
}

/* ---------- cabeçalho v2: slots que embrulham a DEK ---------- */

type Embrulho = { iv: string; ct: string };
type KdfDescritor =
  | { alg: 'argon2id'; m: number; t: number; p: number; sal: string }
  | { alg: 'scrypt'; N: number; r: number; p: number; sal: string };
interface Cabecalho {
  v: 2;
  /** celular sem cofre do sistema disponível na criação: caiu para o slot de senha (proteção só pela senha) */
  rebaixado?: boolean;
  slots: { senha?: { kdf: KdfDescritor; env: Embrulho }; sistema?: { env: Embrulho } };
  /** valor de verificação cifrado pela DEK: confirma uma chave mesmo sem nenhum dado gravado */
  chk: Embrulho;
}

const AAD_SLOT = (nome: string) => `levia:cofre:v2:slot:${nome}`;
const AAD_CHK = 'levia:cofre:v2:chk';
const TEXTO_CHK = 'levia-ok';

function embrulhar(dek: Uint8Array, kek: Uint8Array, aad: string, aleatorio: Aleatorio): Embrulho {
  const iv = aleatorio(12);
  return { iv: paraBase64(iv), ct: paraBase64(gcm(kek, iv, utf8ToBytes(aad)).encrypt(dek)) };
}

function desembrulhar(e: Embrulho, kek: Uint8Array, aad: string): Uint8Array | null {
  try {
    return gcm(kek, deBase64(e.iv), utf8ToBytes(aad)).decrypt(deBase64(e.ct));
  } catch {
    return null;
  }
}

function lerCabecalhoBruto(texto: string | null): Cabecalho | null {
  if (!texto) return null;
  try {
    const c = JSON.parse(texto) as Cabecalho;
    return c && c.v === 2 && c.slots && c.chk ? c : null;
  } catch {
    return null;
  }
}

export interface Cofre {
  estaDesbloqueado(): boolean;
  /** true depois que o aparelho tem cofre (v1 com sal ou v2 com cabeçalho) */
  temCofre(): Promise<boolean>;
  /** Abre o cofre. Cria o cofre v2 na primeira vez e migra o v1. No celular o PIN NÃO é raiz criptográfica:
   *  quem chama precisa ter conferido o PIN (conferirSenha) antes, porque o slot do sistema abre sem ele. */
  desbloquear(pin: string): Promise<void>;
  /** Abre o cofre com a chave de dados guardada (biometria). Falha se a chave não confere. */
  desbloquearComChave(chave: Uint8Array): Promise<void>;
  /** Chave de dados atual, para guardar no cofre do sistema (biometria). null se bloqueado. */
  obterChave(): Uint8Array | null;
  bloquear(): void;
  lerDado(chave: string): Promise<string | null>;
  gravarDado(chave: string, valor: string): Promise<void>;
  /** Troca o PIN: reembrulha a DEK (uma gravação, sem regravar os dados). No celular não há nada a reembrulhar. */
  trocarPin(pinNovo: string): Promise<void>;
  /** Avisa quando o cofre abre ou fecha. Devolve a função para parar de ouvir. */
  ouvir(fn: (desbloqueado: boolean) => void): () => void;
}

export function criarCofre(opcoes: {
  armazenamento: ArmazenamentoBruto;
  aleatorio: Aleatorio;
  /** custo do scrypt só para ABRIR cofres v1 (migração) */
  scrypt?: typeof SCRYPT_DADOS;
  /** custo do Argon2id dos slots de senha novos */
  argon2?: typeof ARGON2_WEB;
  /** presente só no celular */
  chaveSistema?: ProvedorChaveSistema;
}): Cofre {
  const { armazenamento, aleatorio, chaveSistema } = opcoes;
  const pScrypt = opcoes.scrypt ?? SCRYPT_DADOS;
  const pArgon = opcoes.argon2 ?? ARGON2_WEB;
  let chave: Uint8Array | null = null;
  const ouvintes = new Set<(d: boolean) => void>();

  const avisar = () => { for (const fn of ouvintes) fn(chave !== null); };
  const lerCabecalho = async () => lerCabecalhoBruto(await armazenamento.getItem(CHAVE_CABECALHO));
  async function salV1(): Promise<Uint8Array | null> {
    const sal = await armazenamento.getItem(CHAVE_SAL);
    return sal ? deBase64(sal) : null;
  }
  const temCofre = async () => (await lerCabecalho()) !== null || (await salV1()) !== null;

  async function kekDaSenha(senha: string, kdf: KdfDescritor): Promise<Uint8Array> {
    return kdf.alg === 'argon2id'
      ? derivarChaveArgon2(senha, deBase64(kdf.sal), { m: kdf.m, t: kdf.t, p: kdf.p })
      : derivarChave(senha, deBase64(kdf.sal), { N: kdf.N, r: kdf.r, p: kdf.p });
  }

  async function novoSlotSenha(dek: Uint8Array, senha: string) {
    const sal = aleatorio(16);
    const kdf: KdfDescritor = { alg: 'argon2id', ...pArgon, sal: paraBase64(sal) };
    return { kdf, env: embrulhar(dek, await kekDaSenha(senha, kdf), AAD_SLOT('senha'), aleatorio) };
  }

  /** Monta o cabeçalho v2. No celular usa o slot do sistema; sem ele (ou sem cofre do sistema) usa o de senha. */
  async function montarCabecalho(
    dek: Uint8Array,
    credencial: { senha?: string; kekV1?: { kek: Uint8Array; kdf: KdfDescritor } },
  ): Promise<Cabecalho> {
    const cab: Cabecalho = { v: 2, slots: {}, chk: embrulhar(utf8ToBytes(TEXTO_CHK), dek, AAD_CHK, aleatorio) };
    let sistemaOk = false;
    if (chaveSistema) {
      try {
        const kek = (await chaveSistema.ler()) ?? aleatorio(32);
        await chaveSistema.gravar(kek);
        cab.slots.sistema = { env: embrulhar(dek, kek, AAD_SLOT('sistema'), aleatorio) };
        sistemaOk = true;
      } catch {
        cab.rebaixado = true; // cofre do sistema indisponível: não deixa o app sem cofre, mas a proteção cai para a senha
      }
    }
    if (!sistemaOk) {
      if (credencial.senha !== undefined) cab.slots.senha = await novoSlotSenha(dek, credencial.senha);
      else if (credencial.kekV1) {
        cab.slots.senha = { kdf: credencial.kekV1.kdf, env: embrulhar(dek, credencial.kekV1.kek, AAD_SLOT('senha'), aleatorio) };
      } else throw new CofreBloqueado();
    }
    return cab;
  }

  async function abrirSlot(cab: Cabecalho, pin: string | null): Promise<Uint8Array | null> {
    if (cab.slots.sistema && chaveSistema) {
      try {
        const kek = await chaveSistema.ler();
        const dek = kek ? desembrulhar(cab.slots.sistema.env, kek, AAD_SLOT('sistema')) : null;
        if (dek) return dek;
      } catch { /* cofre do sistema indisponível: tenta o slot de senha, se houver */ }
    }
    if (cab.slots.senha && pin !== null) {
      return desembrulhar(cab.slots.senha.env, await kekDaSenha(pin, cab.slots.senha.kdf), AAD_SLOT('senha'));
    }
    return null;
  }

  const confere = (cab: Cabecalho, dek: Uint8Array) => {
    const v = desembrulhar(cab.chk, dek, AAD_CHK);
    return v !== null && bytesToUtf8(v) === TEXTO_CHK;
  };

  /** Dado sensível em texto puro (onboarding) passa para envelope v2 assim que há DEK. */
  async function cifrarTextoPuro(dek: Uint8Array) {
    const pares: [string, string][] = [];
    for (const c of CHAVES_SENSIVEIS) {
      const bruto = await armazenamento.getItem(c);
      if (bruto !== null && !estaCifrado(bruto)) pares.push([c, cifrarTextoV2(bruto, dek, c, aleatorio)]);
    }
    if (pares.length) await armazenamento.multiSet(pares);
  }

  /** v1 -> v2, atômico: reabre tudo em memória e só então grava (multiSet) valores novos + cabeçalho. */
  async function migrarV1(k1: Uint8Array, salAntigo: Uint8Array, pin: string | null) {
    const dek = aleatorio(32);
    const pares: [string, string][] = [];
    for (const c of CHAVES_SENSIVEIS) {
      const bruto = await armazenamento.getItem(c);
      if (bruto === null) continue;
      let texto: string | null;
      if (bruto.startsWith(PREFIXO_ENVELOPE)) texto = decifrarTexto(bruto, k1);
      else if (bruto.startsWith(PREFIXO_ENVELOPE_V2)) texto = null; // não deveria existir sem cabeçalho v2
      else texto = bruto;
      if (texto === null) throw new CofreBloqueado(); // nada é gravado: o v1 continua intacto
      const novo = cifrarTextoV2(texto, dek, c, aleatorio);
      if (decifrarTextoV2(novo, dek, c) !== texto) throw new CofreBloqueado(); // confere a ida e volta
      pares.push([c, novo]);
    }
    const cab = await montarCabecalho(dek, {
      senha: pin ?? undefined,
      kekV1: pin === null ? { kek: k1, kdf: { alg: 'scrypt', ...pScrypt, sal: paraBase64(salAntigo) } } : undefined,
    });
    pares.push([CHAVE_CABECALHO, JSON.stringify(cab)]);
    await armazenamento.multiSet(pares);
    await armazenamento.removeItem(CHAVE_SAL).catch(() => {}); // o cabeçalho v2 já manda; o sal v1 ficou inútil
    chave = dek;
  }

  /** v1: a chave tem que abrir um envelope existente; sem nenhum envelope não há como provar a chave. */
  async function provarChaveV1(k1: Uint8Array) {
    for (const c of CHAVES_SENSIVEIS) {
      const v = await armazenamento.getItem(c);
      if (v !== null && v.startsWith(PREFIXO_ENVELOPE)) {
        if (decifrarTexto(v, k1) === null) throw new CofreBloqueado();
        return;
      }
    }
  }

  async function amostraV2(dek: Uint8Array) {
    for (const c of CHAVES_SENSIVEIS) {
      const v = await armazenamento.getItem(c);
      if (v !== null && v.startsWith(PREFIXO_ENVELOPE_V2)) {
        if (decifrarTextoV2(v, dek, c) === null) throw new CofreBloqueado();
        return;
      }
    }
  }

  return {
    estaDesbloqueado: () => chave !== null,

    temCofre,

    async desbloquear(pin) {
      const cab = await lerCabecalho();
      if (cab) {
        const dek = await abrirSlot(cab, pin);
        if (!dek || !confere(cab, dek)) throw new CofreBloqueado();
        await amostraV2(dek);
        chave = dek;
        // sobe o custo do KDF da senha (scrypt do v1 ou Argon2id mais fraco) sem pedir nada ao usuário
        const s = cab.slots.senha;
        if (s && (s.kdf.alg === 'scrypt' || s.kdf.m < pArgon.m || s.kdf.t < pArgon.t)) {
          try {
            await armazenamento.setItem(
              CHAVE_CABECALHO,
              JSON.stringify({ ...cab, slots: { ...cab.slots, senha: await novoSlotSenha(dek, pin) } }),
            );
          } catch { /* melhor esforço: o slot antigo continua valendo */ }
        }
        await cifrarTextoPuro(dek);
        avisar();
        return;
      }
      const sal = await salV1();
      if (sal) {
        const k1 = await derivarChave(pin, sal, pScrypt);
        await provarChaveV1(k1);
        await migrarV1(k1, sal, pin);
        avisar();
        return;
      }
      // primeira vez: cria a DEK e o cabeçalho v2
      const dek = aleatorio(32);
      const novo = await montarCabecalho(dek, { senha: pin });
      await armazenamento.setItem(CHAVE_CABECALHO, JSON.stringify(novo));
      chave = dek;
      await cifrarTextoPuro(dek);
      avisar();
    },

    async desbloquearComChave(k) {
      const cab = await lerCabecalho();
      if (cab) {
        if (!confere(cab, k)) throw new CofreBloqueado();
        await amostraV2(k);
        chave = k;
        await cifrarTextoPuro(k);
        avisar();
        return;
      }
      const sal = await salV1();
      if (!sal) throw new CofreBloqueado();
      await provarChaveV1(k); // a chave guardada pela biometria no v1 era a derivada do PIN
      let temEnvelope = false;
      for (const c of CHAVES_SENSIVEIS) {
        const v = await armazenamento.getItem(c);
        if (v !== null && v.startsWith(PREFIXO_ENVELOPE)) { temEnvelope = true; break; }
      }
      if (!temEnvelope) throw new CofreBloqueado(); // sem nenhum envelope não há como provar a chave
      await migrarV1(k, sal, null);
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
        // texto puro: aceito com o cofre aberto (cifra no próximo desbloqueio) ou antes de o cofre existir
        if (chave === null && (await temCofre())) throw new CofreBloqueado();
        return bruto;
      }
      if (chave === null) throw new CofreBloqueado();
      const aberto = decifrarTextoV2(bruto, chave, c);
      if (aberto === null) throw new CofreBloqueado();
      return aberto;
    },

    async gravarDado(c, valor) {
      if (!ehSensivel(c)) return armazenamento.setItem(c, valor);
      if (chave === null) {
        if (await temCofre()) throw new CofreBloqueado();
        return armazenamento.setItem(c, valor); // onboarding: cifrado quando o PIN for criado
      }
      await armazenamento.setItem(c, cifrarTextoV2(valor, chave, c, aleatorio));
    },

    async trocarPin(pinNovo) {
      if (chave === null) throw new CofreBloqueado();
      const cab = await lerCabecalho();
      if (!cab) throw new CofreBloqueado();
      if (!cab.slots.senha) return; // celular com cofre do sistema: o PIN não é chave, não há o que reembrulhar
      const novo: Cabecalho = { ...cab, slots: { ...cab.slots, senha: await novoSlotSenha(chave, pinNovo) } };
      await armazenamento.setItem(CHAVE_CABECALHO, JSON.stringify(novo)); // uma gravação: ou troca ou não
    },

    ouvir(fn) {
      ouvintes.add(fn);
      return () => { ouvintes.delete(fn); };
    },
  };
}
