import { AlimentoGlobal, buscarAlimentoPorId, carregarEstendido } from '@constants/alimentosGlobais';

/**
 * Leitura de código de barras: primeiro o banco local (`alimentosEstendidos`), depois Open Food Facts.
 * Só o código de barras sai do aparelho. Nunca dados do usuário.
 */

export const TAMANHOS_CODIGO = [8, 12, 13, 14] as const; // EAN-8, UPC-A, EAN-13, GTIN-14
const URL_OFF = 'https://world.openfoodfacts.org/api/v2/product';
const TIMEOUT_REDE_MS = 8000;
const PORCAO_PADRAO_G = 100;

export type MotivoCodigo = 'invalido' | 'naoEncontrado' | 'rede' | 'dadosIncompletos';

export type ResultadoCodigo =
  | { ok: true; alimento: AlimentoGlobal; fonte: 'local' | 'openfoodfacts' }
  | { ok: false; motivo: MotivoCodigo };

type Fetch = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{ status: number; json: () => Promise<unknown> }>;

/** Mantém só os dígitos e aceita apenas tamanhos de código de barras válidos. */
export function normalizarCodigo(bruto: string): string | null {
  const digitos = bruto.replace(/\D/g, '');
  return (TAMANHOS_CODIGO as readonly number[]).includes(digitos.length) ? digitos : null;
}

interface NutrientesOFF {
  'energy-kcal_100g'?: unknown;
  proteins_100g?: unknown;
  carbohydrates_100g?: unknown;
  fat_100g?: unknown;
  fiber_100g?: unknown;
}

const numero = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Converte a resposta da API em alimento do app. Se faltar algum macro, devolve null:
 * ausência vira "não informado", nunca zero.
 */
export function converterProdutoOFF(json: unknown, codigo: string): AlimentoGlobal | null {
  const corpo = json as { product?: { product_name?: string; product_name_pt?: string; serving_quantity?: unknown; nutriments?: NutrientesOFF } };
  const produto = corpo?.product;
  if (!produto) return null;
  const nome = (produto.product_name_pt || produto.product_name || '').trim();
  const n = produto.nutriments ?? {};
  const kcal = numero(n['energy-kcal_100g']);
  const prot = numero(n.proteins_100g);
  const carb = numero(n.carbohydrates_100g);
  const gord = numero(n.fat_100g);
  const fibra = numero(n.fiber_100g);
  if (!nome || kcal === null || prot === null || carb === null || gord === null || fibra === null) return null;
  const porcao = numero(produto.serving_quantity);
  const gramas = porcao && porcao > 0 ? Math.round(porcao) : PORCAO_PADRAO_G;
  return {
    id: `OFF${codigo}`,
    categoria: 'processados',
    nome,
    kcalPor100g: kcal,
    proteinaGPor100g: prot,
    carboidratoGPor100g: carb,
    gorduraGPor100g: gord,
    fibraGPor100g: fibra,
    gramaPadrao: gramas,
    unidadeComum: `${gramas} g`,
  };
}

/** Consulta o Open Food Facts. Rede, timeout e produto inexistente viram motivos, não exceções. */
export async function buscarNaOpenFoodFacts(codigo: string, fetchFn: Fetch = fetch as unknown as Fetch): Promise<ResultadoCodigo> {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_REDE_MS);
  try {
    const r = await fetchFn(`${URL_OFF}/${codigo}.json`, { headers: { 'User-Agent': 'Levia-app' }, signal: controle.signal });
    if (r.status === 404) return { ok: false, motivo: 'naoEncontrado' };
    if (r.status < 200 || r.status >= 300) return { ok: false, motivo: 'rede' };
    const json = await r.json();
    if ((json as { status?: number })?.status !== 1) return { ok: false, motivo: 'naoEncontrado' };
    const alimento = converterProdutoOFF(json, codigo);
    return alimento ? { ok: true, alimento, fonte: 'openfoodfacts' } : { ok: false, motivo: 'dadosIncompletos' };
  } catch {
    return { ok: false, motivo: 'rede' };
  } finally {
    clearTimeout(timer);
  }
}

/** Ponto de entrada: banco local primeiro, depois Open Food Facts. */
export async function buscarProdutoPorCodigo(bruto: string, fetchFn?: Fetch): Promise<ResultadoCodigo> {
  const codigo = normalizarCodigo(bruto);
  if (!codigo) return { ok: false, motivo: 'invalido' };
  await carregarEstendido(); // na PWA o banco local é baixado sob demanda
  const local = buscarAlimentoPorId(`O${codigo}`);
  if (local) return { ok: true, alimento: local, fonte: 'local' };
  return buscarNaOpenFoodFacts(codigo, fetchFn);
}
