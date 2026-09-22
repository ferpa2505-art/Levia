import AsyncStorage from '@react-native-async-storage/async-storage';
import { NoticiaItem } from '@models/news';

const CHAVE_CACHE_NOTICIAS = 'levia:news_cache';

interface CacheNoticias {
  itens: NoticiaItem[];
  atualizadoEm: string;
}

export async function carregarNoticiasCache(): Promise<CacheNoticias | null> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_CACHE_NOTICIAS);
    if (!bruto) return null;
    return JSON.parse(bruto) as CacheNoticias;
  } catch {
    return null;
  }
}

export async function salvarNoticiasCache(itens: NoticiaItem[]): Promise<void> {
  try {
    const cache: CacheNoticias = { itens, atualizadoEm: new Date().toISOString() };
    await AsyncStorage.setItem(CHAVE_CACHE_NOTICIAS, JSON.stringify(cache));
  } catch {
    // silencioso: se falhar em salvar o cache, o app segue funcionando normalmente
  }
}
