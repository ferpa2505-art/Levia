/**
 * Busca usada nas sugestões do Diário e do montador de receitas.
 *
 * - ignora acentos e maiúsculas ("acucar" encontra "Açúcar")
 * - com 1 letra, sugere o que começa com ela (nome ou qualquer palavra)
 * - a partir de 2 letras, também encontra o termo no meio do nome
 * - ordem: começa com o termo > alguma palavra começa com o termo > contém;
 *   empate fica com a ordem da lista (itens mais comuns vêm primeiro) e,
 *   depois, com o nome mais curto
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function pontuacao(nomeNormalizado: string, termo: string): number | null {
  if (nomeNormalizado.startsWith(termo)) return 0;
  // cada palavra digitada precisa casar com o início de alguma palavra do nome
  // ("batata crua" encontra "Batata inglesa crua")
  const palavrasNome = nomeNormalizado.split(/[\s/(),-]+/);
  const palavrasTermo = termo.split(/\s+/).filter(Boolean);
  if (palavrasTermo.every((pt) => palavrasNome.some((pn) => pn.startsWith(pt)))) return 1;
  // no meio da palavra só a partir de 4 letras, para "cen" não puxar "concentrado"
  if (palavrasTermo.every((pt) => pt.length >= 4 && nomeNormalizado.includes(pt))) return 2;
  return null;
}

export function buscarPorNome<T>(itens: T[], termo: string, nomeDe: (item: T) => string, limite = 8): T[] {
  const t = normalizarTexto(termo);
  if (!t) return [];
  return itens
    .map((item, ordem) => {
      const nome = normalizarTexto(nomeDe(item));
      return { item, ordem, nome, p: pontuacao(nome, t) };
    })
    .filter((x) => x.p !== null)
    .sort((a, b) => a.p! - b.p! || a.ordem - b.ordem || a.nome.length - b.nome.length)
    .slice(0, limite)
    .map((x) => x.item);
}
