import { createContext, useContext, useState, ReactNode } from 'react';
import {
  DiabetesData,
  diabetesDadosVazios,
  RegistroGlicemia,
  RegistroMedicacao,
  RegistroRefeicao,
  NotaDiaria,
} from '@models/diabetes';
import { dataDeHoje, horarioAgora, gerarId } from '@utils/recordsStorage';

// Dados mockados iniciais
const DADOS_MOCKADOS: DiabetesData = {
  glicemias: [
    {
      id: '1',
      data: dataDeHoje(),
      horario: '08:30',
      valor: 118,
      unidade: 'mg/dL',
      notas: 'Após café da manhã',
    },
    {
      id: '2',
      data: dataDeHoje(),
      horario: '12:15',
      valor: 145,
      unidade: 'mg/dL',
      notas: 'Antes do almoço',
    },
    {
      id: '3',
      data: dataDeHoje(),
      horario: '18:00',
      valor: 128,
      unidade: 'mg/dL',
      notas: 'Antes do jantar',
    },
  ],
  medicacoes: [
    {
      id: '1',
      data: dataDeHoje(),
      horario: '08:00',
      medicamento: 'Metformina',
      dosagem: '500mg',
      observacoes: 'Dose matinal',
    },
    {
      id: '2',
      data: dataDeHoje(),
      horario: '20:00',
      medicamento: 'Metformina',
      dosagem: '500mg',
      observacoes: 'Dose noturna',
    },
  ],
  refeicoes: [
    {
      id: '1',
      data: dataDeHoje(),
      horario: '08:00',
      tipo: 'Café da manhã',
      carboidratos: 45,
      alimentos: 'Pão, queijo, suco',
      observacoes: '',
    },
    {
      id: '2',
      data: dataDeHoje(),
      horario: '12:30',
      tipo: 'Almoço',
      carboidratos: 60,
      alimentos: 'Arroz, feijão, frango com salada',
      observacoes: '',
    },
    {
      id: '3',
      data: dataDeHoje(),
      horario: '19:00',
      tipo: 'Jantar',
      carboidratos: 50,
      alimentos: 'Pasta com legumes',
      observacoes: '',
    },
  ],
  notas: [
    {
      id: '1',
      data: dataDeHoje(),
      timestamp: '22:00',
      conteudo: 'Dia com níveis de glicemia bem controlados. Pratiquei uma caminhada de 30 minutos.',
    },
  ],
};

interface DiabetesContextValue {
  loading: boolean;
  glicemias: RegistroGlicemia[];
  medicacoes: RegistroMedicacao[];
  refeicoes: RegistroRefeicao[];
  notas: NotaDiaria[];
  ultimaGlicemia: RegistroGlicemia | null;
  mediaGlicemiaHoje: number;
  glicemiaHoje: RegistroGlicemia[];
  adicionarGlicemia: (valor: number, unidade: string, notas?: string) => Promise<void>;
  removerGlicemia: (id: string) => Promise<void>;
  adicionarMedicacao: (medicamento: string, dosagem: string, observacoes?: string) => Promise<void>;
  removerMedicacao: (id: string) => Promise<void>;
  adicionarRefeicao: (
    tipo: string,
    carboidratos: number,
    alimentos?: string,
    observacoes?: string
  ) => Promise<void>;
  removerRefeicao: (id: string) => Promise<void>;
  adicionarNota: (conteudo: string) => Promise<void>;
  removerNota: (id: string) => Promise<void>;
}

const DiabetesContext = createContext<DiabetesContextValue | undefined>(undefined);

export function DiabetesProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<DiabetesData>(DADOS_MOCKADOS);
  const [loading] = useState(false);

  const hoje = dataDeHoje();
  const glicemiaHoje = dados.glicemias.filter((g) => g.data === hoje);
  const ultimaGlicemia = glicemiaHoje.length > 0 ? glicemiaHoje[glicemiaHoje.length - 1] : null;
  const mediaGlicemiaHoje =
    glicemiaHoje.length > 0
      ? Math.round(
          glicemiaHoje.reduce((sum, g) => sum + g.valor, 0) / glicemiaHoje.length * 10
        ) / 10
      : 0;

  async function adicionarGlicemia(valor: number, unidade: string, notas?: string) {
    const novoRegistro: RegistroGlicemia = {
      id: gerarId(),
      data: dataDeHoje(),
      horario: horarioAgora(),
      valor,
      unidade: unidade as 'mg/dL' | 'mmol/L',
      notas,
    };
    setDados((prev) => ({
      ...prev,
      glicemias: [...prev.glicemias, novoRegistro],
    }));
  }

  async function removerGlicemia(id: string) {
    setDados((prev) => ({
      ...prev,
      glicemias: prev.glicemias.filter((g) => g.id !== id),
    }));
  }

  async function adicionarMedicacao(medicamento: string, dosagem: string, observacoes?: string) {
    const novoRegistro: RegistroMedicacao = {
      id: gerarId(),
      data: dataDeHoje(),
      horario: horarioAgora(),
      medicamento,
      dosagem,
      observacoes,
    };
    setDados((prev) => ({
      ...prev,
      medicacoes: [...prev.medicacoes, novoRegistro],
    }));
  }

  async function removerMedicacao(id: string) {
    setDados((prev) => ({
      ...prev,
      medicacoes: prev.medicacoes.filter((m) => m.id !== id),
    }));
  }

  async function adicionarRefeicao(
    tipo: string,
    carboidratos: number,
    alimentos?: string,
    observacoes?: string
  ) {
    const novoRegistro: RegistroRefeicao = {
      id: gerarId(),
      data: dataDeHoje(),
      horario: horarioAgora(),
      tipo,
      carboidratos,
      alimentos,
      observacoes,
    };
    setDados((prev) => ({
      ...prev,
      refeicoes: [...prev.refeicoes, novoRegistro],
    }));
  }

  async function removerRefeicao(id: string) {
    setDados((prev) => ({
      ...prev,
      refeicoes: prev.refeicoes.filter((r) => r.id !== id),
    }));
  }

  async function adicionarNota(conteudo: string) {
    const novaNotaId = gerarId();
    const novaNota: NotaDiaria = {
      id: novaNotaId,
      data: dataDeHoje(),
      timestamp: horarioAgora(),
      conteudo,
    };
    setDados((prev) => ({
      ...prev,
      notas: [...prev.notas, novaNota],
    }));
  }

  async function removerNota(id: string) {
    setDados((prev) => ({
      ...prev,
      notas: prev.notas.filter((n) => n.id !== id),
    }));
  }

  return (
    <DiabetesContext.Provider
      value={{
        loading,
        glicemias: dados.glicemias,
        medicacoes: dados.medicacoes,
        refeicoes: dados.refeicoes,
        notas: dados.notas,
        ultimaGlicemia,
        mediaGlicemiaHoje,
        glicemiaHoje,
        adicionarGlicemia,
        removerGlicemia,
        adicionarMedicacao,
        removerMedicacao,
        adicionarRefeicao,
        removerRefeicao,
        adicionarNota,
        removerNota,
      }}
    >
      {children}
    </DiabetesContext.Provider>
  );
}

export function useDiabetes() {
  const context = useContext(DiabetesContext);
  if (!context) {
    throw new Error('useDiabetes deve ser usado dentro de DiabetesProvider');
  }
  return context;
}
