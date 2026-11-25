/** Formatos de código de barras de embalagem, no nome usado pelo BarcodeDetector do navegador. */
const FORMATOS_EMBALAGEM = ['ean_13', 'ean_8', 'upc_a', 'upc_e'] as const;

/**
 * Formatos que o leitor vai pedir: só os de embalagem que o aparelho diz que lê.
 * Pedir um formato que o aparelho não lê faz o leitor do navegador falhar ao ser criado.
 */
export function escolherFormatos(suportados: readonly string[]): string[] {
  return FORMATOS_EMBALAGEM.filter((f) => suportados.includes(f));
}

/** O primeiro código lido que tenha conteúdo, sem espaços. */
export function primeiroCodigo(resultados: ReadonlyArray<{ rawValue?: string }>): string | null {
  for (const r of resultados) {
    const v = (r.rawValue ?? '').trim();
    if (v) return v;
  }
  return null;
}
