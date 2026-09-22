import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ReceitaPersonalizada, IngredienteUsado } from '@models/ingredients';
import {
  carregarReceitasPersonalizadas,
  salvarReceitasPersonalizadas,
} from '@utils/customRecipesStorage';
import { gerarId } from '@utils/recordsStorage';

interface CustomRecipesContextValue {
  loading: boolean;
  receitasPersonalizadas: ReceitaPersonalizada[];
  criarReceita: (nome: string, itens: IngredienteUsado[]) => Promise<ReceitaPersonalizada | null>;
  removerReceita: (id: string) => Promise<void>;
  buscarReceitasPersonalizadas: (termo: string) => ReceitaPersonalizada[];
}

const CustomRecipesContext = createContext<CustomRecipesContextValue | undefined>(undefined);

export function CustomRecipesProvider({ children }: { children: ReactNode }) {
  const [receitas, setReceitas] = useState<ReceitaPersonalizada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarReceitasPersonalizadas().then((r) => {
      setReceitas(r);
      setLoading(false);
    });
  }, []);

  async function persistir(novasReceitas: ReceitaPersonalizada[]) {
    setReceitas(novasReceitas);
    await salvarReceitasPersonalizadas(novasReceitas);
  }

  async function criarReceita(nome: string, itens: IngredienteUsado[]): Promise<ReceitaPersonalizada | null> {
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
      criadaEm: new Date().toISOString(),
    };

    await persistir([...receitas, nova]);
    return nova;
  }

  async function removerReceita(id: string) {
    await persistir(receitas.filter((r) => r.id !== id));
  }

  function buscarReceitasPersonalizadas(termo: string): ReceitaPersonalizada[] {
    const termoLimpo = termo.trim().toLowerCase();
    if (termoLimpo.length < 2) return [];
    return receitas
      .filter((r) => r.nome.toLowerCase().includes(termoLimpo))
      .slice(0, 5);
  }

  return (
    <CustomRecipesContext.Provider
      value={{ loading, receitasPersonalizadas: receitas, criarReceita, removerReceita, buscarReceitasPersonalizadas }}
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
