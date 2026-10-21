import ptBR, { ChaveTraducao, TraducoesParciais } from './traducoes/pt-BR';
import ptPT from './traducoes/pt-PT';
import es from './traducoes/es';
import enUS from './traducoes/en-US';
import enGB from './traducoes/en-GB';
import it from './traducoes/it';
import fr from './traducoes/fr';
import de from './traducoes/de';
import nl from './traducoes/nl';
import pl from './traducoes/pl';
import tr from './traducoes/tr';
import ru from './traducoes/ru';
import ja from './traducoes/ja';
import ko from './traducoes/ko';
import zhCN from './traducoes/zh-CN';
import id from './traducoes/id';
import vi from './traducoes/vi';
import th from './traducoes/th';
import hi from './traducoes/hi';
import ar from './traducoes/ar';

export type { ChaveTraducao };

export type CodigoIdioma =
  | 'pt-BR' | 'pt-PT' | 'es' | 'en-US' | 'en-GB' | 'it' | 'fr' | 'de' | 'nl' | 'pl'
  | 'tr' | 'ru' | 'ja' | 'ko' | 'zh-CN' | 'id' | 'vi' | 'th' | 'hi' | 'ar';

/** Lista mostrada na tela de escolha de idioma (nome escrito no próprio idioma). */
export const IDIOMAS: { codigo: CodigoIdioma; nome: string; bandeira: string }[] = [
  { codigo: 'pt-BR', nome: 'Português (Brasil)', bandeira: '🇧🇷' },
  { codigo: 'pt-PT', nome: 'Português (Portugal)', bandeira: '🇵🇹' },
  { codigo: 'es', nome: 'Español', bandeira: '🇪🇸' },
  { codigo: 'en-US', nome: 'English (US)', bandeira: '🇺🇸' },
  { codigo: 'en-GB', nome: 'English (UK)', bandeira: '🇬🇧' },
  { codigo: 'it', nome: 'Italiano', bandeira: '🇮🇹' },
  { codigo: 'fr', nome: 'Français', bandeira: '🇫🇷' },
  { codigo: 'de', nome: 'Deutsch', bandeira: '🇩🇪' },
  { codigo: 'nl', nome: 'Nederlands', bandeira: '🇳🇱' },
  { codigo: 'pl', nome: 'Polski', bandeira: '🇵🇱' },
  { codigo: 'tr', nome: 'Türkçe', bandeira: '🇹🇷' },
  { codigo: 'ru', nome: 'Русский', bandeira: '🇷🇺' },
  { codigo: 'ja', nome: '日本語', bandeira: '🇯🇵' },
  { codigo: 'ko', nome: '한국어', bandeira: '🇰🇷' },
  { codigo: 'zh-CN', nome: '简体中文', bandeira: '🇨🇳' },
  { codigo: 'id', nome: 'Bahasa Indonesia', bandeira: '🇮🇩' },
  { codigo: 'vi', nome: 'Tiếng Việt', bandeira: '🇻🇳' },
  { codigo: 'th', nome: 'ไทย', bandeira: '🇹🇭' },
  { codigo: 'hi', nome: 'हिन्दी', bandeira: '🇮🇳' },
  { codigo: 'ar', nome: 'العربية', bandeira: '🇸🇦' },
];

const TRADUCOES: Record<CodigoIdioma, TraducoesParciais> = {
  'pt-BR': ptBR, 'pt-PT': ptPT, es, 'en-US': enUS, 'en-GB': enGB, it, fr, de, nl, pl,
  tr, ru, ja, ko, 'zh-CN': zhCN, id, vi, th, hi, ar,
};

export function idiomaValido(codigo: string | null | undefined): codigo is CodigoIdioma {
  return !!codigo && codigo in TRADUCOES;
}

/**
 * Descobre o idioma do celular e devolve o mais próximo que o app tem.
 * Ex.: "pt-BR" → pt-BR, "pt-PT" → pt-PT, "en-AU" → en-GB, "es-MX" → es.
 * Se não tiver nenhum parecido, usa inglês (EUA).
 */
export function detectarIdiomaDoCelular(): CodigoIdioma {
  let local = 'en-US';
  try {
    local = Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
  } catch {
    // sem Intl — fica em inglês
  }
  const [lingua, regiao] = local.replace('_', '-').split('-');
  const l = (lingua || '').toLowerCase();
  const r = (regiao || '').toUpperCase();

  if (l === 'pt') return r === 'PT' || r === 'AO' || r === 'MZ' ? 'pt-PT' : 'pt-BR';
  if (l === 'en') return r === 'US' || r === '' ? 'en-US' : r === 'CA' || r === 'PH' ? 'en-US' : 'en-GB';
  if (l === 'zh') return 'zh-CN';
  if (l === 'in') return 'id'; // código antigo do indonésio no Android
  if (idiomaValido(l)) return l;
  return 'en-US';
}

/** Traduz uma chave. Parâmetros entre chaves são substituídos: {nome}, {meta}... */
export function traduzir(
  idioma: CodigoIdioma,
  chave: ChaveTraducao,
  params?: Record<string, string | number>
): string {
  // chave que o idioma ainda não tem: inglês (pt-PT usa o pt-BR)
  const reserva = idioma === 'pt-PT' ? ptBR : enUS;
  let texto = TRADUCOES[idioma]?.[chave] ?? reserva[chave] ?? ptBR[chave] ?? chave;
  if (params) {
    for (const [nome, valor] of Object.entries(params)) {
      texto = texto.split(`{${nome}}`).join(String(valor));
    }
  }
  return texto;
}

/* ------------------------------------------------------------------
 * Itens de catálogo (exercícios, locais, sintomas, medicamentos...)
 * ------------------------------------------------------------------ */
import { CATALOGO } from './catalogo';

/**
 * Traduz um item de catálogo a partir do texto original em português.
 * Se não houver tradução, devolve o próprio texto (ex.: nomes próprios).
 */
export function traduzirCatalogo(idioma: CodigoIdioma, textoPt: string): string {
  return CATALOGO[idioma]?.[textoPt] ?? textoPt;
}

/* ------------------------------------------------------------------
 * Idioma atual para código fora das telas (ex.: notificações)
 * ------------------------------------------------------------------ */
let idiomaAtual: CodigoIdioma = 'pt-BR';

export function definirIdiomaAtual(idioma: CodigoIdioma) {
  idiomaAtual = idioma;
}

export function obterIdiomaAtual(): CodigoIdioma {
  return idiomaAtual;
}

/** Traduz usando o idioma escolhido no app — para usar fora dos componentes. */
export function traduzirAtual(chave: ChaveTraducao, params?: Record<string, string | number>): string {
  return traduzir(idiomaAtual, chave, params);
}
