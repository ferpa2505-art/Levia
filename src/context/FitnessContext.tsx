import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessaoTreino, Treino } from '@/types/fitness';
import { gerarId } from '@utils/recordsStorage';

const CHAVE = 'levia:fitness';

interface DadosFitness {
  treinos: Treino[];
  sessoes: SessaoTreino[];
}

interface FitnessContextValue extends DadosFitness {
  loading: boolean;
  salvarTreino: (treino: Omit<Treino, 'id' | 'criadoEm'> & { id?: string }) => Promise<void>;
  removerTreino: (id: string) => Promise<void>;
  registrarSessao: (sessao: Omit<SessaoTreino, 'id'>) => Promise<void>;
  removerSessao: (id: string) => Promise<void>;
}

const FitnessContext = createContext<FitnessContextValue | undefined>(undefined);

export function FitnessProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<DadosFitness>({ treinos: [], sessoes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CHAVE);
        if (raw) {
          const salvo = JSON.parse(raw) as Partial<DadosFitness>;
          setDados({ treinos: salvo.treinos ?? [], sessoes: salvo.sessoes ?? [] });
        }
      } catch {
        // dados corrompidos: começa vazio, sem apagar nada do disco
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persistir(novo: DadosFitness) {
    setDados(novo);
    await AsyncStorage.setItem(CHAVE, JSON.stringify(novo)).catch(() => {});
  }

  async function salvarTreino(entrada: Omit<Treino, 'id' | 'criadoEm'> & { id?: string }) {
    const existente = entrada.id ? dados.treinos.find((t) => t.id === entrada.id) : undefined;
    const treino: Treino = {
      id: entrada.id ?? gerarId(),
      nome: entrada.nome,
      exercicios: entrada.exercicios,
      criadoEm: existente?.criadoEm ?? new Date().toISOString(),
    };
    const treinos = existente
      ? dados.treinos.map((t) => (t.id === treino.id ? treino : t))
      : [...dados.treinos, treino];
    await persistir({ ...dados, treinos });
  }

  async function removerTreino(id: string) {
    await persistir({ ...dados, treinos: dados.treinos.filter((t) => t.id !== id) });
  }

  async function registrarSessao(sessao: Omit<SessaoTreino, 'id'>) {
    const nova: SessaoTreino = { ...sessao, id: gerarId() };
    await persistir({ ...dados, sessoes: [nova, ...dados.sessoes] });
  }

  async function removerSessao(id: string) {
    await persistir({ ...dados, sessoes: dados.sessoes.filter((s) => s.id !== id) });
  }

  return (
    <FitnessContext.Provider
      value={{ ...dados, loading, salvarTreino, removerTreino, registrarSessao, removerSessao }}
    >
      {children}
    </FitnessContext.Provider>
  );
}

export function useFitness() {
  const ctx = useContext(FitnessContext);
  if (!ctx) throw new Error('useFitness precisa estar dentro de FitnessProvider');
  return ctx;
}
