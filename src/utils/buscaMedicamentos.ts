import { MEDICAMENTOS_PT, MEDICAMENTOS_EN, ItemMedicamento } from '@constants/medicamentos';
import { normalizarTexto } from '@utils/buscaAlimentos';

export interface SugestaoMedicamento {
  nome: string;
  principio?: string;
}

/** Nomes normalizados calculados uma vez por lista (são ~10 mil itens) */
const cache = new Map<ItemMedicamento[], string[]>();
function normalizados(lista: ItemMedicamento[]) {
  let n = cache.get(lista);
  if (!n) {
    n = lista.map((i) => normalizarTexto(i[0]));
    cache.set(lista, n);
  }
  return n;
}

/**
 * Sugestões a partir de 3 letras. Português usa a lista da ANVISA; os demais
 * idiomas usam a lista da FDA. Primeiro o que começa com o termo, depois o
 * que tem uma palavra começando com ele; princípios ativos antes de marcas.
 */
export function buscarMedicamentos(termo: string, idioma: string, limite = 8): SugestaoMedicamento[] {
  const t = normalizarTexto(termo);
  if (t.length < 3) return [];
  const lista = idioma.startsWith('pt') ? MEDICAMENTOS_PT : MEDICAMENTOS_EN;
  const nomes = normalizados(lista);
  const achados: { i: number; p: number }[] = [];
  for (let i = 0; i < lista.length; i++) {
    const n = nomes[i];
    const p = n.startsWith(t) ? 0 : n.split(/[\s/(),-]+/).some((w) => w.startsWith(t)) ? 2 : -1;
    if (p >= 0) achados.push({ i, p: p + (lista[i].length > 1 ? 1 : 0) });
  }
  return achados
    .sort((a, b) => a.p - b.p || nomes[a.i].length - nomes[b.i].length)
    .slice(0, limite)
    .map(({ i }) => ({ nome: lista[i][0], principio: lista[i][1] }));
}
