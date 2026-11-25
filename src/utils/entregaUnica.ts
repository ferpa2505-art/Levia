/**
 * Trava do leitor de código de barras: a câmera lê o mesmo código várias vezes por segundo,
 * então só a primeira leitura de cada abertura do leitor é entregue. `reabrir` solta a trava
 * sempre que o leitor abre de novo (antes ela só soltava ao tocar em "Fechar", e a leitura
 * seguinte era ignorada em silêncio).
 */
export function criarEntregaUnica() {
  let jaEntregou = false;
  return {
    entregar(codigo: string, aoLer: (codigo: string) => void) {
      const limpo = codigo.trim();
      if (jaEntregou || !limpo) return;
      jaEntregou = true;
      aoLer(limpo);
    },
    reabrir() {
      jaEntregou = false;
    },
  };
}
