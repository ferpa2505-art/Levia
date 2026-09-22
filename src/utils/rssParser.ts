import { NoticiaItem } from '@models/news';

/**
 * Entidades nomeadas mais comuns em feeds RSS de sites em português
 * (acentos, cedilha, travessão, aspas tipográficas). Cobrem o que os
 * geradores de RSS mais antigos costumam usar; o resto (numéricas,
 * tipo &#233; ou &#xE9;) é resolvido de forma genérica abaixo.
 */
const ENTIDADES_NOMEADAS: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã',
  eacute: 'é', ecirc: 'ê',
  iacute: 'í',
  oacute: 'ó', ocirc: 'ô', otilde: 'õ',
  uacute: 'ú', ucirc: 'û',
  ccedil: 'ç', ntilde: 'ñ',
  Aacute: 'Á', Agrave: 'À', Acirc: 'Â', Atilde: 'Ã',
  Eacute: 'É', Ecirc: 'Ê',
  Iacute: 'Í',
  Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ',
  Uacute: 'Ú', Ccedil: 'Ç',
  mdash: '—', ndash: '–', hellip: '…',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D',
};

function decodificarEntidades(texto: string): string {
  return texto
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (match, nome) => ENTIDADES_NOMEADAS[nome] ?? match)
    .trim();
}

function extrairTag(bloco: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = bloco.match(regex);
  return match ? decodificarEntidades(match[1]) : '';
}

function limparHtml(texto: string): string {
  return texto.replace(/<[^>]+>/g, '').trim();
}

/**
 * Parser leve de RSS 2.0, feito com regex pra não precisar instalar
 * nenhuma dependência nova no projeto. Cobre os campos que a gente
 * realmente usa (title, link, pubDate, description).
 */
export function parseRss(xml: string, fonte: string): NoticiaItem[] {
  const blocos = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  return blocos
    .map((bloco, index) => {
      const titulo = extrairTag(bloco, 'title');
      const link = extrairTag(bloco, 'link').trim();
      const pubDateBruto = extrairTag(bloco, 'pubDate');
      const descricaoBruta = extrairTag(bloco, 'description') || extrairTag(bloco, 'content:encoded');
      const resumoCompleto = limparHtml(descricaoBruta);
      const resumo = resumoCompleto.length > 160 ? `${resumoCompleto.slice(0, 160).trim()}…` : resumoCompleto;

      let publicadoEm = pubDateBruto;
      const dataConvertida = new Date(pubDateBruto);
      if (!isNaN(dataConvertida.getTime())) {
        publicadoEm = dataConvertida.toISOString();
      }

      const item: NoticiaItem = {
        id: link || `${fonte}-${index}-${titulo}`,
        titulo,
        link,
        resumo,
        fonte,
        publicadoEm,
      };
      return item;
    })
    .filter((item) => item.titulo.length > 0 && item.link.length > 0);
}
