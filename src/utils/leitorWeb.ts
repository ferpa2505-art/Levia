/** Formatos de código de barras de embalagem, no nome usado pelo BarcodeDetector do navegador. */
const FORMATOS_EMBALAGEM = ['ean_13', 'ean_8', 'upc_a', 'upc_e'] as const;

/**
 * Formatos que o leitor vai pedir: só os de embalagem que o aparelho diz que lê.
 * Pedir um formato que o aparelho não lê faz o leitor do navegador falhar ao ser criado.
 */
export function escolherFormatos(suportados: readonly string[]): string[] {
  return FORMATOS_EMBALAGEM.filter((f) => suportados.includes(f));
}

/**
 * Arquivo do leitor próprio (zxing-wasm), servido pelo leviapp.org: a CSP não deixa baixar de CDN.
 * public/wasm/zxing_reader.wasm é cópia da versão instalada (um teste confere o hash).
 */
export const CAMINHO_WASM_LEITOR = '/wasm/zxing_reader.wasm';

/** locateFile do zxing-wasm: o .wasm vem do próprio site; o resto segue o caminho padrão. */
export function localizarArquivoLeitor(arquivo: string, prefixo: string): string {
  return arquivo.endsWith('.wasm') ? CAMINHO_WASM_LEITOR : prefixo + arquivo;
}

/** iPhone ou iPad (o iPad recente se apresenta como Mac, mas tem tela de toque). */
export function ehIOS(nav: { userAgent?: string; maxTouchPoints?: number }): boolean {
  const ua = nav.userAgent ?? '';
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && (nav.maxTouchPoints ?? 0) > 1;
}

/** O primeiro código lido que tenha conteúdo, sem espaços. */
export function primeiroCodigo(resultados: ReadonlyArray<{ rawValue?: string }>): string | null {
  for (const r of resultados) {
    const v = (r.rawValue ?? '').trim();
    if (v) return v;
  }
  return null;
}
