import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { ReceitaPersonalizada, IngredienteUsado, PORCAO_PADRAO_G } from '@models/ingredients';
import {
  carregarReceitasPersonalizadas,
  salvarReceitasPersonalizadas,
} from '@utils/customRecipesStorage';
import { gerarId } from '@utils/recordsStorage';
import { buscarPorNome } from '@utils/buscaAlimentos';

interface CustomRecipesContextValue {
  loading: boolean;
  receitasPersonalizadas: ReceitaPersonalizada[];
  criarReceita: (nome: string, itens: IngredienteUsado[], porcaoPadraoG?: number) => Promise<ReceitaPersonalizada | null>;
  atualizarPorcaoPadrao: (id: string, gramas: number) => Promise<void>;
  removerReceita: (id: string) => Promise<void>;
  buscarReceitasPersonalizadas: (termo: string) => ReceitaPersonalizada[];
}

const CustomRecipesContext = createContext<CustomRecipesContextValue | undefined>(undefined);

export function CustomRecipesProvider({ children }: { children: ReactNode }) {
  const [receitas, setReceitas] = useState<ReceitaPersonalizada[]>([]);
  // sempre a versão mais nova dos dados (evita perder registros em toques rápidos)
  const receitasRef = useRef(receitas);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarReceitasPersonalizadas().then((r) => {
      receitasRef.current = r;
      setReceitas(r);
      setLoading(false);
    });
  }, []);

  async function persistir(novasReceitas: ReceitaPersonalizada[]) {
    receitasRef.current = novasReceitas;
    setReceitas(novasReceitas);
    await salvarReceitasPersonalizadas(novasReceitas);
  }

  async function criarReceita(
    nome: string,
    itens: IngredienteUsado[],
    porcaoPadraoG: number = PORCAO_PADRAO_G
  ): Promise<ReceitaPersonalizada | null> {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo || itens.length === 0) return null;

    const pesoTotalG = itens.reduce((soma, i) => soma + i.gramas, 0);
    const kcalTotal = itens.reduce((soma, i) => soma + i.kcal, 0);
    const proteinaGTotal = itens.reduce((soma, i) => soma + i.proteinaG, 0);

    if (pesoTotalG <= 0) return null;

    const nova: ReceitaPersonalizada = {
      id: gerarId(),
      nome: nomeLimpo,
      ingredientes: itens,
      pesoTotalG,
      kcalTotal: Math.round(kcalTotal),
      proteinaGTotal: Math.round(proteinaGTotal * 10) / 10,
      kcalPor100g: Math.round((kcalTotal / pesoTotalG) * 100),
      proteinaGPor100g: Math.round(((proteinaGTotal / pesoTotalG) * 100) * 10) / 10,
      porcaoPadraoG,
      criadaEm: new Date().toISOString(),
    };

    await persistir([...receitasRef.current, nova]);
    return nova;
  }

  async function atualizarPorcaoPadrao(id: string, gramas: number) {
    if (!(gramas > 0)) return;
    await persistir(receitasRef.current.map((r) => (r.id === id ? { ...r, porcaoPadraoG: gramas } : r)));
  }

  async function removerReceita(id: string) {
    await persistir(receitasRef.current.filter((r) => r.id !== id));
  }

  function buscarReceitasPersonalizadas(termo: string): ReceitaPersonalizada[] {
    return buscarPorNome(receitas, termo, (r) => r.nome, 5);
  }

  return (
    <CustomRecipesContext.Provider
      value={{
        loading,
        receitasPersonalizadas: receitas,
        criarReceita,
        atualizarPorcaoPadrao,
        removerReceita,
        buscarReceitasPersonalizadas,
      }}
    >
      {children}
    </CustomRecipesContext.Provider>
  );
}

export function useCustomRecipes() {
  const ctx = useContext(CustomRecipesContext);
  if (!ctx) {
    throw new Error('useCustomRecipes precisa ser usado dentro de um CustomRecipesProvider');
  }
  return ctx;
}
