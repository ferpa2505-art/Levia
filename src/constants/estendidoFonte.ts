/**
 * Onde o banco ESTENDIDO (Open Food Facts) é lido. Esta versão vale para o app instalado e para os testes:
 * o arquivo vai junto no app. A versão web fica em `estendidoFonte.web.ts` e baixa o arquivo só quando precisa,
 * para ele não pesar na abertura da PWA.
 * Linha: [id "O"+código de barras, categoria, kcal, proteína, carboidrato, gordura, fibra, porçãoG, nome, país]
 */
export type LinhaEstendida = [string, string, number, number, number, number, number, number, string, string];
export interface BancoEstendido { itens: LinhaEstendida[] }

/** O banco já disponível agora, sem esperar (no app instalado ele vem no pacote). */
export function bancoEstendidoImediato(): BancoEstendido | null {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../../public/dados/alimentosEstendidos.json') as BancoEstendido;
}

export async function lerBancoEstendido(): Promise<BancoEstendido | null> {
  return bancoEstendidoImediato();
}
