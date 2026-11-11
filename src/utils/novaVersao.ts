/**
 * Atualização do app instalado no navegador (PWA). Cada publicação gera um arquivo de código com nome novo
 * (entry-<código>.js); a página inicial aponta para ele. Se o código da página no servidor for diferente do que
 * está rodando, existe versão nova.
 */
const PADRAO_BUNDLE = /\/_expo\/static\/js\/web\/entry-[A-Za-z0-9]+\.js/;

/** O arquivo de código que a página (HTML ou endereço de script) usa, ou null se não achar. */
export function bundleDaPagina(texto: string | null | undefined): string | null {
  if (!texto) return null;
  const achado = texto.match(PADRAO_BUNDLE);
  return achado ? achado[0] : null;
}

/** Há versão nova quando os dois códigos são conhecidos e diferentes. Na dúvida (não achou um deles), não avisa. */
export function haNovaVersao(bundleRodando: string | null, htmlDoServidor: string | null | undefined): boolean {
  const novo = bundleDaPagina(htmlDoServidor);
  return !!bundleRodando && !!novo && bundleRodando !== novo;
}
