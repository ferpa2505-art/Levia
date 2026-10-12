/**
 * Pequenos utilitários só para a versão web (PWA). O projeto é compilado sem
 * os tipos do navegador (DOM), por isso o acesso passa por `globalThis`.
 * Nunca chame estas funções fora do navegador (Platform.OS === 'web').
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nav = globalThis as any;

/** Faz o navegador baixar um arquivo com o conteúdo informado. */
export function baixarArquivo(nome: string, conteudo: string, tipo: string) {
  const blob = new nav.Blob([conteudo], { type: tipo });
  const url = nav.URL.createObjectURL(blob);
  const link = nav.document.createElement('a');
  link.href = url;
  link.download = nome;
  nav.document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => nav.URL.revokeObjectURL(url), 10_000);
}

/** Abre uma aba vazia (precisa ser chamada logo no toque do botão). */
export function abrirJanela(): {
  escrever: (html: string) => void;
  imprimir: () => void;
} | null {
  const janela = nav.open('', '_blank');
  if (!janela) return null;
  return {
    escrever: (html: string) => {
      janela.document.open();
      janela.document.write(html);
      janela.document.close();
    },
    imprimir: () => {
      janela.focus();
      janela.print();
    },
  };
}
