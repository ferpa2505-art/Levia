import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { buscarAlimentosGlobais, buscarAlimentoPorId, AlimentoGlobal, IdiomaAlimentos } from '@constants/alimentosGlobais';
import { ingredientes } from '@constants/ingredients';
import { AlimentoPor100g, Ingrediente } from '@models/ingredients';
import { normalizarTexto } from '@utils/buscaAlimentos';

/**
 * Análise da foto do prato pela IA (worker levia-ia-worker → Gemini).
 * A IA só diz QUAIS alimentos e QUANTOS GRAMAS; os nutrientes vêm do banco
 * do app. Quando o banco não tem o alimento, usa a estimativa da IA (marcada).
 */

const URL_IA = 'https://levia-ia-worker.ferpa2505.workers.dev/v1/analisar-prato';
// Freio contra uso do endereço fora do app. Não é segredo forte (vai dentro do app);
// a proteção real são as cotas no servidor.
const TOKEN_APP = '6tFv9bY2eNq9CiP4oFzCO83a5eXZuitvW8FwRAs0AyM';

const CHAVE_INSTALACAO = 'levia:instalacao';
const CHAVE_CONSENTIMENTO = 'levia:consentimentoIA';

export interface ItemIA {
  nome: string;
  nomeIngles: string;
  unidades: number;
  gramas: number;
  confianca: number;
  por100g: { kcal: number; proteina: number; carboidrato: number; gordura: number; fibra: number };
}

/** Item já ligado a um alimento: do banco, ou com os valores estimados pela IA */
export interface SugestaoIA {
  nomeIA: string;
  gramas: number;
  unidades: number;
  confianca: number;
  alimento: AlimentoPor100g;
  origem: 'banco' | 'ia';
}

export type ResultadoIA =
  | { ok: true; sugestoes: SugestaoIA[]; restantes: number }
  | { ok: false; motivo: 'naoComida' | 'cota' | 'limite' | 'rede' | 'servidor'; liberaEm?: string };

export async function idDaInstalacao(): Promise<string> {
  const salvo = await AsyncStorage.getItem(CHAVE_INSTALACAO);
  if (salvo) return salvo;
  const novo = randomUUID();
  await AsyncStorage.setItem(CHAVE_INSTALACAO, novo);
  return novo;
}

export async function temConsentimentoIA(): Promise<boolean> {
  return (await AsyncStorage.getItem(CHAVE_CONSENTIMENTO)) === '1';
}

export async function darConsentimentoIA(): Promise<void> {
  await AsyncStorage.setItem(CHAVE_CONSENTIMENTO, '1');
}

/** JPEG de no máximo 1024 px no lado maior: ~150–300 KB, suficiente para a IA */
async function fotoReduzidaBase64(uri: string): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  const original = await ctx.renderAsync();
  const deitada = original.width >= original.height;
  const lado = deitada ? original.width : original.height;
  if (lado > 1024) ctx.resize(deitada ? { width: 1024 } : { height: 1024 });
  const img = lado > 1024 ? await ctx.renderAsync() : original;
  const salva = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true });
  if (!salva.base64) throw new Error('sem base64');
  return salva.base64;
}

const palavras = (s: string) => normalizarTexto(s).split(/[\s/(),-]+/).filter(Boolean);

/**
 * Entre os candidatos da busca, o mais parecido com o nome da IA: nome igual
 * primeiro; depois o com menos palavras sobrando. Prato montado ("X com Y")
 * só ganha se a IA também descreveu uma combinação.
 */
function melhorCandidato(nome: string, candidatos: Ingrediente[]): Ingrediente | undefined {
  const alvo = normalizarTexto(nome);
  const pAlvo = palavras(nome);
  const combinacao = /\b(com|with|con|avec)\b|,/.test(alvo);
  let melhor: Ingrediente | undefined;
  let melhorNota = Infinity;
  for (const c of candidatos) {
    const n = normalizarTexto(c.nome);
    const id = (c as { id?: string }).id ?? '';
    const ehPrato = /^[PBVSW]\d/.test(id) || /\b(com|with|con|avec)\b|,/.test(n);
    const sobra = palavras(c.nome).filter((w) => !pAlvo.some((a) => w.startsWith(a) || a.startsWith(w))).length;
    // prato montado quando a IA viu um alimento só: melhor usar a estimativa da IA
    if (ehPrato && !combinacao) continue;
    const nota = (n === alvo ? -100 : 0) + sobra * 10;
    if (nota < melhorNota) {
      melhorNota = nota;
      melhor = c;
    }
  }
  return melhor;
}

/** Liga o nome dado pela IA a um alimento do banco (lista curada primeiro), ou usa a estimativa da IA */
export function ligarAoBanco(item: ItemIA, idioma: IdiomaAlimentos): SugestaoIA {
  const base = { nomeIA: item.nome, gramas: item.gramas, unidades: item.unidades, confianca: item.confianca };
  // muitos candidatos: os pratos montados ("Batata cozida com …") vêm antes na busca por prefixo
  const peloNome = melhorCandidato(item.nome, buscarAlimentosGlobais(item.nome, 300, idioma, idioma === 'pt' ? ingredientes : []));
  const peloIngles = (): Ingrediente | undefined => {
    if (!item.nomeIngles) return undefined;
    const c = melhorCandidato(item.nomeIngles, buscarAlimentosGlobais(item.nomeIngles, 300, 'en')) as AlimentoGlobal | undefined;
    // achou em inglês: mostra o nome no idioma do app
    return c ? (buscarAlimentoPorId(c.id, idioma) ?? c) : undefined;
  };
  const achado = peloNome ?? peloIngles();
  if (achado) {
    return { ...base, alimento: { ...achado, porcaoPadraoG: achado.gramaPadrao }, origem: 'banco' };
  }
  return {
    ...base,
    origem: 'ia',
    alimento: {
      nome: item.nome,
      kcalPor100g: item.por100g.kcal,
      proteinaGPor100g: item.por100g.proteina,
      carboidratoGPor100g: item.por100g.carboidrato,
      gorduraGPor100g: item.por100g.gordura,
      fibraGPor100g: item.por100g.fibra,
    },
  };
}

export async function analisarFotoDoPrato(uri: string, idioma: IdiomaAlimentos): Promise<ResultadoIA> {
  let resposta: Response;
  try {
    const [imagem, instalacao] = await Promise.all([fotoReduzidaBase64(uri), idDaInstalacao()]);
    resposta = await fetch(URL_IA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-levia-app': TOKEN_APP },
      body: JSON.stringify({ imagem, instalacao, idioma }),
    });
  } catch {
    return { ok: false, motivo: 'rede' };
  }
  let dados: { erro?: string; liberaEm?: string; ehComida?: boolean; itens?: ItemIA[]; restantes?: number } = {};
  try {
    dados = await resposta.json();
  } catch {
    return { ok: false, motivo: 'servidor' };
  }
  if (resposta.status === 402) return { ok: false, motivo: 'cota', liberaEm: dados.liberaEm };
  if (resposta.status === 429) return { ok: false, motivo: 'limite' };
  if (!resposta.ok) return { ok: false, motivo: 'servidor' };
  if (!dados.ehComida || !dados.itens?.length) return { ok: false, motivo: 'naoComida' };
  return {
    ok: true,
    restantes: dados.restantes ?? 0,
    sugestoes: dados.itens.map((i) => ligarAoBanco(i, idioma)),
  };
}
