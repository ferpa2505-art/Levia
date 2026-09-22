export interface FonteNoticia {
  nome: string;
  url: string;
}

/**
 * Feeds RSS públicos de sites de saúde/nutrição em português,
 * lidos ao vivo pelo app (sem chave de API, sem custo).
 */
export const fontesNoticias: FonteNoticia[] = [
  { nome: 'Tua Saúde', url: 'https://www.tuasaude.com/feed/' },
];

/**
 * Palavras-chave usadas pra filtrar, dentro do feed geral de saúde,
 * só as notícias que realmente falam de dieta/nutrição ou exercício —
 * que é o que interessa aqui no Levia.
 */
const palavrasChaveRelevantes = [
  'dieta', 'nutri', 'aliment', 'emagrec', 'caloria', 'proteína', 'proteina',
  'carboidrato', 'gordura', 'jejum', 'exercíc', 'exercic', 'treino',
  'atividade física', 'atividade fisica', 'fitness', 'muscul', 'corrida',
  'caminhada', 'ioga', 'yoga', 'pilates', 'peso', 'obesidade', 'metabolismo',
  'suplemento', 'vitamina', 'fibra', 'açúcar', 'acucar', 'saúde física', 'saude fisica',
];

export function eRelevante(texto: string): boolean {
  const textoLimpo = texto.toLowerCase();
  return palavrasChaveRelevantes.some((p) => textoLimpo.includes(p));
}
