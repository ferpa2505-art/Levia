import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

/**
 * Licença do serial: quem recebe um serial no WhatsApp o ativa aqui e o Worker devolve uma
 * licença assinada, presa a esta instalação. A IA só responde com essa licença.
 * A verificação de verdade é no servidor: este arquivo só guarda e envia.
 */
const WORKER = 'https://levia-ia-worker.ferpa2505.workers.dev';
const CHAVE_INSTALACAO = 'levia:instalacao';
const CHAVE_LICENCA = 'levia:licenca';

type Ouvinte = (ativa: boolean) => void;
const ouvintes = new Set<Ouvinte>();

/** Avisa quando a licença é ativada ou apagada (o layout usa para abrir/fechar o portão). Devolve como parar de ouvir. */
export function aoMudarLicenca(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => { ouvintes.delete(ouvinte); };
}
const avisar = (ativa: boolean) => ouvintes.forEach((fn) => fn(ativa));

export interface Licenca {
  licenca: string;
  plano: 'teste' | 'assinatura';
  acessoAte: string;
}

export type ResultadoAtivacao =
  | { ok: true; plano: Licenca['plano']; acessoAte: string }
  | { ok: false; motivo: 'invalido' | 'dispositivos' | 'emUso' | 'limite' | 'expirado' | 'rede' | 'servidor' };

export async function idDaInstalacao(): Promise<string> {
  const salvo = await AsyncStorage.getItem(CHAVE_INSTALACAO);
  if (salvo) return salvo;
  const novo = randomUUID();
  await AsyncStorage.setItem(CHAVE_INSTALACAO, novo);
  return novo;
}

export async function lerLicenca(): Promise<Licenca | null> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_LICENCA);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as Partial<Licenca>;
    return typeof dados.licenca === 'string' && dados.licenca ? (dados as Licenca) : null;
  } catch {
    return null;
  }
}

/** Esquece a licença (o servidor disse que não vale mais) para o app pedir o serial de novo. */
export async function limparLicenca(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_LICENCA);
  avisar(false);
}

export async function ativarSerial(serial: string): Promise<ResultadoAtivacao> {
  let resposta: Response;
  try {
    const instalacao = await idDaInstalacao();
    resposta = await fetch(`${WORKER}/v1/ativar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serial: serial.trim(), instalacao }),
    });
  } catch {
    return { ok: false, motivo: 'rede' };
  }
  let dados: { erro?: string; licenca?: string; plano?: Licenca['plano']; acessoAte?: string } = {};
  try { dados = await resposta.json(); } catch { return { ok: false, motivo: 'servidor' }; }

  if (resposta.ok && dados.licenca && dados.plano) {
    const nova: Licenca = { licenca: dados.licenca, plano: dados.plano, acessoAte: dados.acessoAte ?? '' };
    await AsyncStorage.setItem(CHAVE_LICENCA, JSON.stringify(nova));
    avisar(true);
    return { ok: true, plano: nova.plano, acessoAte: nova.acessoAte };
  }
  if (resposta.status === 402) return { ok: false, motivo: 'expirado' };
  if (resposta.status === 403) return { ok: false, motivo: 'invalido' };
  if (resposta.status === 409) return { ok: false, motivo: dados.erro === 'instalacao_em_uso' ? 'emUso' : 'dispositivos' };
  if (resposta.status === 429) return { ok: false, motivo: 'limite' };
  return { ok: false, motivo: 'servidor' };
}
