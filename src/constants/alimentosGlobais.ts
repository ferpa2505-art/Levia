import { Ingrediente } from '@models/ingredients';
import { normalizarTexto } from '@utils/buscaAlimentos';
import { obterIdiomaAtual, CodigoIdioma } from '@/i18n';

/**
 * Banco global de alimentos e pratos prontos do Levia, em 5 idiomas.
 *
 * Gerado por scripts/alimentos/build.py (não edite o JSON à mão). Fontes abertas:
 *  - TACO 4ª ed. (NEPA/UNICAMP) via github.com/brolesi/taco (MIT)
 *  - ANSES-CIQUAL / CALNUT 2020 (Licence Ouverte Etalab 2.0)
 *  - USDA FoodData Central SR Legacy (domínio público)
 *  - TempoLife Food Dataset (CC-BY-4.0) — exige crédito visível:
 *    "Food nutrition data from TempoLife (tempolife.app), CC-BY-4.0."
 *  - Pratos montados: calculados pelo Levia (soma ponderada por gramas)
 *
 * Valores sempre por 100 g. `gramaPadrao` = porção sugerida.
 */

export type IdiomaAlimentos = 'pt' | 'en' | 'es' | 'fr' | 'it';

export type CategoriaAlimento =
  | 'graos' | 'paes' | 'massas' | 'frutas' | 'vegetais' | 'tuberculos' | 'leguminosas'
  | 'carnes' | 'aves' | 'embutidos' | 'peixes' | 'ovos' | 'laticinios' | 'queijos'
  | 'oleaginosas' | 'gorduras' | 'doces' | 'bebidas' | 'alcoolicas' | 'molhos' | 'snacks'
  | 'pratos' | 'sopas' | 'fastfood' | 'cafe_manha' | 'suplementos' | 'combinacoes';

export interface AlimentoGlobal extends Ingrediente {
  id: string;
  categoria: CategoriaAlimento;
  carboidratoGPor100g: number;
  gorduraGPor100g: number;
  fibraGPor100g: number;
}

// [id, categoria, kcal, proteína, carboidrato, gordura, fibra, porçãoG, pt, en, es, fr, it]
type Linha = [string, CategoriaAlimento, number, number, number, number, number, number, string, string, string, string, string];

interface BancoAlimentos {
  versao: number;
  idiomas: IdiomaAlimentos[];
  categorias: Record<CategoriaAlimento, [string, string, string, string, string]>;
  fontes: Record<string, string>;
  itens: Linha[];
}

// require (e não import) para o TypeScript não inferir o tipo de 4 mil linhas
// eslint-disable-next-line @typescript-eslint/no-var-requires
const banco: BancoAlimentos = require('../data/alimentosGlobais.json');

const POSICAO: Record<IdiomaAlimentos, number> = { pt: 0, en: 1, es: 2, fr: 3, it: 4 };

/** Converte o idioma do app (20 opções) para um dos 5 idiomas do banco. */
export function idiomaDosAlimentos(codigo: CodigoIdioma | string): IdiomaAlimentos {
  const c = String(codigo).toLowerCase();
  if (c.startsWith('pt')) return 'pt';
  if (c.startsWith('es')) return 'es';
  if (c.startsWith('fr')) return 'fr';
  if (c.startsWith('it')) return 'it';
  return 'en';
}

export function idiomaAtualDosAlimentos(): IdiomaAlimentos {
  return idiomaDosAlimentos(obterIdiomaAtual());
}

interface Indexado {
  item: Ingrediente;
  ordem: number;
  nome: string; // normalizado
  palavras: string[];
}

// prefixo do id: T = TACO, C = CIQUAL, U = USDA, E = TempoLife, P/B/V/S/W = pratos montados
const PRIORIDADE_FONTE: Record<IdiomaAlimentos, string> = {
  pt: 'TPBVSWCEU',
  en: 'UEPBVSWCT',
  es: 'CPBVSWUET',
  fr: 'CPBVSWUET',
  it: 'CPBVSWUET',
};

const cacheLista: Partial<Record<IdiomaAlimentos, AlimentoGlobal[]>> = {};
const cacheIndice: Partial<Record<IdiomaAlimentos, Indexado[]>> = {};

function separarPalavras(nomeNormalizado: string): string[] {
  return nomeNormalizado.split(/[\s/(),-]+/).filter(Boolean);
}

/** Todos os alimentos do banco, com o nome no idioma pedido (lista em cache). */
export function alimentosGlobais(idioma: IdiomaAlimentos = idiomaAtualDosAlimentos()): AlimentoGlobal[] {
  const pronto = cacheLista[idioma];
  if (pronto) return pronto;
  const col = 8 + POSICAO[idioma];
  const lista = banco.itens.map((l): AlimentoGlobal => ({
    id: l[0],
    categoria: l[1],
    nome: l[col] as string,
    kcalPor100g: l[2],
    proteinaGPor100g: l[3],
    carboidratoGPor100g: l[4],
    gorduraGPor100g: l[5],
    fibraGPor100g: l[6],
    gramaPadrao: l[7],
    unidadeComum: `${l[7]} g`,
  }));
  cacheLista[idioma] = lista;
  return lista;
}

function indice(idioma: IdiomaAlimentos): Indexado[] {
  const pronto = cacheIndice[idioma];
  if (pronto) return pronto;
  // no empate, a fonte mais próxima do idioma aparece primeiro
  // (TACO para português; CIQUAL/USDA para os demais)
  const prioridade = PRIORIDADE_FONTE[idioma];
  const ind = alimentosGlobais(idioma).map((item, i) => {
    const nome = normalizarTexto(item.nome);
    const ordem = (prioridade.indexOf(item.id[0]) + 1) * 100000 + i;
    return { item, ordem, nome, palavras: separarPalavras(nome) };
  });
  cacheIndice[idioma] = ind;
  return ind;
}

/** Mesma regra de src/utils/buscaAlimentos.ts, mas com o nome já normalizado. */
function pontuar(x: Indexado, termo: string, palavrasTermo: string[]): number | null {
  if (x.nome.startsWith(termo)) return 0;
  if (palavrasTermo.every((pt) => x.palavras.some((pn) => pn.startsWith(pt)))) return 1;
  if (palavrasTermo.every((pt) => pt.length >= 4 && x.nome.includes(pt))) return 2;
  return null;
}

/**
 * Busca no banco global (nome no idioma pedido). `extras` entram na frente
 * em caso de empate — usado para a lista curada com porções caseiras.
 */
export function buscarAlimentosGlobais(
  termo: string,
  limite = 8,
  idioma: IdiomaAlimentos = idiomaAtualDosAlimentos(),
  extras: Ingrediente[] = [],
): Ingrediente[] {
  const t = normalizarTexto(termo);
  if (!t) return [];
  const palavrasTermo = t.split(/\s+/).filter(Boolean);
  const candidatos: { x: Indexado; p: number }[] = [];
  const nomesExtras = new Set<string>();
  extras.forEach((item, i) => {
    const nome = normalizarTexto(item.nome);
    nomesExtras.add(nome);
    const x: Indexado = { item, ordem: i - extras.length, nome, palavras: separarPalavras(nome) };
    const p = pontuar(x, t, palavrasTermo);
    if (p !== null) candidatos.push({ x, p });
  });
  for (const x of indice(idioma)) {
    if (nomesExtras.has(x.nome)) continue;
    const p = pontuar(x, t, palavrasTermo);
    if (p !== null) candidatos.push({ x, p });
  }
  return candidatos
    .sort((a, b) => a.p - b.p || a.x.ordem - b.x.ordem || a.x.nome.length - b.x.nome.length)
    .slice(0, limite)
    .map((c) => c.x.item);
}

export function buscarAlimentoPorId(id: string, idioma: IdiomaAlimentos = idiomaAtualDosAlimentos()): AlimentoGlobal | undefined {
  return alimentosGlobais(idioma).find((a) => a.id === id);
}

export function nomeCategoria(categoria: CategoriaAlimento, idioma: IdiomaAlimentos = idiomaAtualDosAlimentos()): string {
  return banco.categorias[categoria]?.[POSICAO[idioma]] ?? categoria;
}

export function alimentosPorCategoria(categoria: CategoriaAlimento, idioma: IdiomaAlimentos = idiomaAtualDosAlimentos()): AlimentoGlobal[] {
  return alimentosGlobais(idioma).filter((a) => a.categoria === categoria);
}

/** Texto de crédito das fontes (exigido pelas licenças CC-BY e Etalab). */
export const CREDITO_FONTES_ALIMENTOS =
  'TACO (NEPA/UNICAMP) · ANSES-CIQUAL/CALNUT (Licence Ouverte Etalab) · USDA FoodData Central · ' +
  'Food nutrition data from TempoLife (tempolife.app), CC-BY-4.0.';

export const TOTAL_ALIMENTOS_GLOBAIS = banco.itens.length;
