/**
 * Medidas da foto reduzida: o lado maior passa a ter no máximo `maximo` pixels, mantendo a proporção.
 * Lança erro quando a imagem não tem medidas (formato que o navegador não conseguiu abrir).
 */
export function dimensoesReduzidas(largura: number, altura: number, maximo: number): { largura: number; altura: number } {
  if (!(largura > 0) || !(altura > 0)) throw new Error('imagem sem medidas');
  const escala = Math.min(1, maximo / Math.max(largura, altura));
  return {
    largura: Math.max(1, Math.round(largura * escala)),
    altura: Math.max(1, Math.round(altura * escala)),
  };
}
