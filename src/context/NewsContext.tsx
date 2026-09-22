import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { NoticiaItem } from '@models/news';
import { parseRss } from '@utils/rssParser';
import { carregarNoticiasCache, salvarNoticiasCache } from '@utils/newsStorage';
import { fontesNoticias, eRelevante } from '@constants/newsFeeds';

interface NewsContextValue {
  noticias: NoticiaItem[];
  loading: boolean;
  atualizando: boolean;
  erro: string | null;
  atualizadoEm: string | null;
  atualizarNoticias: () => Promise<void>;
}

const NewsContext = createContext<NewsContextValue | undefined>(undefined);

export function NewsProvider({ children }: { children: ReactNode }) {
  const [noticias, setNoticias] = useState<NoticiaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);

  const buscarDeFontes = useCallback(async (): Promise<NoticiaItem[]> => {
    const resultados = await Promise.allSettled(
      fontesNoticias.map(async (fonte) => {
        const resposta = await fetch(fonte.url);
        const xml = await resposta.text();
        return parseRss(xml, fonte.nome);
      })
    );

    const todosItens = resultados
      .filter((r): r is PromiseFulfilledResult<NoticiaItem[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    if (todosItens.length === 0) {
      throw new Error('Não foi possível buscar notícias agora.');
    }

    // Prioriza notícias que falam de dieta/nutrição/exercício; se o filtro
    // deixar pouca coisa, mostra o feed geral pra não sobrar tela vazia.
    const relevantes = todosItens.filter((item) => eRelevante(`${item.titulo} ${item.resumo}`));
    const listaFinal = relevantes.length >= 3 ? relevantes : todosItens;

    return listaFinal.sort((a, b) => (a.publicadoEm < b.publicadoEm ? 1 : -1));
  }, []);

  const atualizarNoticias = useCallback(async () => {
    setAtualizando(true);
    setErro(null);
    try {
      const itens = await buscarDeFontes();
      setNoticias(itens);
      await salvarNoticiasCache(itens);
      setAtualizadoEm(new Date().toISOString());
    } catch {
      setErro('Não foi possível atualizar as notícias agora. Verifique sua internet.');
    } finally {
      setAtualizando(false);
    }
  }, [buscarDeFontes]);

  useEffect(() => {
    (async () => {
      const cache = await carregarNoticiasCache();
      if (cache && cache.itens.length > 0) {
        setNoticias(cache.itens);
        setAtualizadoEm(cache.atualizadoEm);
      }
      setLoading(false);
      atualizarNoticias();
    })();
    // busca só uma vez ao montar o provider; atualizações depois disso
    // acontecem via pull-to-refresh na tela de notícias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NewsContext.Provider value={{ noticias, loading, atualizando, erro, atualizadoEm, atualizarNoticias }}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const ctx = useContext(NewsContext);
  if (!ctx) {
    throw new Error('useNews precisa ser usado dentro de um NewsProvider');
  }
  return ctx;
}
