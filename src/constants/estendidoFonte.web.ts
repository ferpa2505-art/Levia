/**
 * Banco ESTENDIDO na PWA: o arquivo fica fora do código do app (public/dados) e só é baixado na primeira vez
 * que precisa (tela de refeição, busca ou código de barras). O service worker guarda a cópia no aparelho.
 */
export type LinhaEstendida = [string, string, number, number, number, number, number, number, string, string];
export interface BancoEstendido { itens: LinhaEstendida[] }

const ENDERECO = '/dados/alimentosEstendidos.json';

export function bancoEstendidoImediato(): BancoEstendido | null {
  return null;
}

export async function lerBancoEstendido(): Promise<BancoEstendido | null> {
  const resposta = await fetch(ENDERECO);
  if (!resposta.ok) throw new Error(`catálogo estendido: HTTP ${resposta.status}`);
  const banco = (await resposta.json()) as BancoEstendido;
  return Array.isArray(banco?.itens) ? banco : null;
}
