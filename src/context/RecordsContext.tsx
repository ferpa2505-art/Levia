import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RecordsData, registrosVazios, Refeicao, RegistroAgua, RegistroPeso } from '@models/records';
import {
  carregarRegistros,
  salvarRegistros,
  dataDeHoje,
  horarioAgora,
  gerarId,
} from '@utils/recordsStorage';

interface RecordsContextValue {
  loading: boolean;
  refeicoesHoje: Refeicao[];
  aguaHojeMl: number;
  kcalHoje: number;
  proteinaHojeG: number;
  pesoAtualKg: number | null;
  adicionarRefeicao: (nome: string, kcal: number, proteinaG: number) => Promise<void>;
  removerRefeicao: (id: string) => Promise<void>;
  adicionarAgua: (ml: number) => Promise<void>;
  adicionarPeso: (pesoKg: number) => Promise<void>;
}

const RecordsContext = createContext<RecordsContextValue | undefined>(undefined);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<RecordsData>(registrosVazios);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarRegistros().then((d) => {
      setDados(d);
      setLoading(false);
    });
  }, []);

  async function persistir(novosDados: RecordsData) {
    setDados(novosDados);
    await salvarRegistros(novosDados);
  }

  const hoje = dataDeHoje();
  const refeicoesHoje = dados.refeicoes.filter((r) => r.data === hoje);
  const aguaHojeMl = dados.aguas
    .filter((a) => a.data === hoje)
    .reduce((soma, a) => soma + a.ml, 0);
  const kcalHoje = refeicoesHoje.reduce((soma, r) => soma + r.kcal, 0);
  const proteinaHojeG = refeicoesHoje.reduce((soma, r) => soma + r.proteinaG, 0);

  const pesosOrdenados = [...dados.pesos].sort((a, b) => (a.data < b.data ? 1 : -1));
  const pesoAtualKg = pesosOrdenados.length > 0 ? pesosOrdenados[0].pesoKg : null;

  async function adicionarRefeicao(nome: string, kcal: number, proteinaG: number) {
    const nova: Refeicao = { id: gerarId(), data: hoje, horario: horarioAgora(), nome, kcal, proteinaG };
    await persistir({ ...dados, refeicoes: [...dados.refeicoes, nova] });
  }

  async function removerRefeicao(id: string) {
    await persistir({ ...dados, refeicoes: dados.refeicoes.filter((r) => r.id !== id) });
  }

  async function adicionarAgua(ml: number) {
    const novo: RegistroAgua = { id: gerarId(), data: hoje, horario: horarioAgora(), ml };
    await persistir({ ...dados, aguas: [...dados.aguas, novo] });
  }

  async function adicionarPeso(pesoKg: number) {
    const novo: RegistroPeso = { id: gerarId(), data: hoje, pesoKg };
    await persistir({ ...dados, pesos: [...dados.pesos, novo] });
  }

  return (
    <RecordsContext.Provider
      value={{
        loading,
        refeicoesHoje,
        aguaHojeMl,
        kcalHoje,
        proteinaHojeG,
        pesoAtualKg,
        adicionarRefeicao,
        removerRefeicao,
        adicionarAgua,
        adicionarPeso,
      }}
    >
      {children}
    </RecordsContext.Provider>
  );
}

export function useRecords() {
  const ctx = useContext(RecordsContext);
  if (!ctx) {
    throw new Error('useRecords precisa ser usado dentro de um RecordsProvider');
  }
  return ctx;
}
