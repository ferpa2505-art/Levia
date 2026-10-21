import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlimentoPor100g } from '@models/ingredients';
import { normalizarTexto } from '@utils/buscaAlimentos';
import { gerarId } from '@utils/recordsStorage';

/**
 * Alimentos e bebidas que a pessoa digitou à mão. Ficam guardados no aparelho
 * (e entram no backup) para não precisar cadastrar de novo: aparecem na busca
 * da refeição como qualquer alimento do banco.
 */
const CHAVE = 'levia:alimentos_salvos';
/** 'nunca' = a pessoa pediu para não perguntar mais sobre enviar à equipe */
const CHAVE_COMPARTILHAR = 'levia:compartilhar_alimentos';

/** Medidas caseiras aceitas na refeição. `g` e `ml` valem 1 g por unidade. */
export const UNIDADES = ['g', 'ml', 'unidade', 'porcao', 'fatia', 'colher_sopa', 'colher_cha', 'xicara', 'copo'] as const;
export type UnidadeMedida = (typeof UNIDADES)[number];

/** Gramas aproximadas de 1 medida, quando o alimento não define a dele */
const GRAMAS_PADRAO: Record<UnidadeMedida, number> = {
  g: 1,
  ml: 1,
  unidade: 50,
  porcao: 100,
  fatia: 25,
  colher_sopa: 15,
  colher_cha: 5,
  xicara: 240,
  copo: 200,
};

export function gramasPadraoDaUnidade(u: UnidadeMedida, porcaoPadraoG?: number): number {
  if (u === 'porcao' || u === 'unidade') return porcaoPadraoG ?? GRAMAS_PADRAO[u];
  return GRAMAS_PADRAO[u];
}

/** g e ml são a própria medida: não há gramas por unidade para ajustar */
export const unidadeDireta = (u: UnidadeMedida) => u === 'g' || u === 'ml';

export interface AlimentoSalvo extends AlimentoPor100g {
  id: string;
  /** Medida usada no cadastro, sugerida de novo ao escolher o alimento */
  unidade: UnidadeMedida;
  /** Gramas (ou ml) de 1 unidade da medida acima */
  gramasPorUnidade: number;
  criadoEm: string;
  usadoEm?: string;
}

export async function carregarAlimentosSalvos(): Promise<AlimentoSalvo[]> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE);
    const dados = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

async function gravar(lista: AlimentoSalvo[]) {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(lista)).catch(() => {});
}

/**
 * Salva (ou atualiza, se já houver um com o mesmo nome) e devolve a lista nova.
 * `novo` indica se o nome ainda não existia.
 */
export async function salvarAlimento(
  dados: Omit<AlimentoSalvo, 'id' | 'criadoEm'>
): Promise<{ lista: AlimentoSalvo[]; novo: boolean }> {
  const lista = await carregarAlimentosSalvos();
  const chave = normalizarTexto(dados.nome);
  const existente = lista.find((a) => normalizarTexto(a.nome) === chave);
  const agora = new Date().toISOString();
  const item: AlimentoSalvo = { ...dados, id: existente?.id ?? gerarId(), criadoEm: existente?.criadoEm ?? agora, usadoEm: agora };
  const nova = [...lista.filter((a) => a.id !== item.id), item];
  await gravar(nova);
  return { lista: nova, novo: !existente };
}

/** Marca o uso (os mais usados recentemente aparecem primeiro nos atalhos) */
export async function marcarUso(id: string): Promise<AlimentoSalvo[]> {
  const lista = await carregarAlimentosSalvos();
  const nova = lista.map((a) => (a.id === id ? { ...a, usadoEm: new Date().toISOString() } : a));
  await gravar(nova);
  return nova;
}

export async function removerAlimento(id: string): Promise<AlimentoSalvo[]> {
  const nova = (await carregarAlimentosSalvos()).filter((a) => a.id !== id);
  await gravar(nova);
  return nova;
}

export function recentes(lista: AlimentoSalvo[], n: number): AlimentoSalvo[] {
  return [...lista].sort((a, b) => (b.usadoEm ?? b.criadoEm).localeCompare(a.usadoEm ?? a.criadoEm)).slice(0, n);
}

export async function naoPerguntarCompartilhar(): Promise<boolean> {
  return (await AsyncStorage.getItem(CHAVE_COMPARTILHAR).catch(() => null)) === 'nunca';
}

export async function nuncaCompartilhar(): Promise<void> {
  await AsyncStorage.setItem(CHAVE_COMPARTILHAR, 'nunca').catch(() => {});
}
