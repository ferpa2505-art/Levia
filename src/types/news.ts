export interface NoticiaItem {
  id: string;
  titulo: string;
  link: string;
  resumo: string;
  fonte: string;
  /** ISO 8601 quando dá pra converter a data original do feed; senão, o texto bruto do pubDate */
  publicadoEm: string;
}
