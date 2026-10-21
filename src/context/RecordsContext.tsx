import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import {
  RecordsData,
  registrosVazios,
  Refeicao,
  RegistroAgua,
  RegistroPeso,
  RegistroExercicio,
  TipoRefeicao,
  tipoPeloHorario,
} from '@models/records';
import { Nutrientes, somarNutrientes } from '@models/ingredients';
import { carregarDiabetes } from '@utils/diabetesStorage';
import { apagarFoto } from '@utils/fotosRefeicao';
import { agendarLembreteRefeicao, cancelarLembreteRefeicao } from '@utils/lembreteRefeicao';
import { traduzirAtual } from '@/i18n';
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
  aguasHoje: RegistroAgua[];
  aguaHojeMl: number;
  /** Toda a água registrada (gráficos e relatórios) */
  aguas: RegistroAgua[];
  kcalHoje: number;
  proteinaHojeG: number;
  pesoAtualKg: number | null;
  /** Pesagens em ordem cronológica (mais antiga primeiro) */
  pesos: RegistroPeso[];
  exerciciosHoje: RegistroExercicio[];
  kcalGastaHoje: number;
  carboidratoHojeG: number;
  gorduraHojeG: number;
  fibraHojeG: number;
  /** Soma dos 5 nutrientes de um dia (AAAA-MM-DD) */
  nutrientesDoDia: (data: string) => ReturnType<typeof somarNutrientes> & { refeicoes: number };
  /** Todas as refeições (para navegar por outros dias) */
  refeicoes: Refeicao[];
  adicionarRefeicao: (nome: string, nutrientes: Nutrientes) => Promise<void>;
  /** Cria (sem id) ou atualiza (com id) uma refeição completa */
  salvarRefeicao: (refeicao: Omit<Refeicao, 'id'> & { id?: string }, lembreteHoras?: number | null) => Promise<{ lembreteAgendado: boolean }>;
  removerRefeicao: (id: string) => Promise<void>;
  adicionarAgua: (ml: number) => Promise<void>;
  removerAgua: (id: string) => Promise<void>;
  adicionarPeso: (pesoKg: number) => Promise<void>;
  removerPeso: (id: string) => Promise<void>;
  adicionarExercicio: (
    nome: string,
    duracaoMin: number,
    kcalGasto: number,
    detalhes?: { intensidade?: string; local?: string; grupoMuscular?: string }
  ) => Promise<void>;
  removerExercicio: (id: string) => Promise<void>;
}

const RecordsContext = createContext<RecordsContextValue | undefined>(undefined);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<RecordsData>(registrosVazios);
  // sempre a versão mais nova dos dados (evita perder registros em toques rápidos)
  const dadosRef = useRef(dados);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let d = await carregarRegistros();
      if (!d.migradoRefeicoesDiabetes) {
        // traz as refeições do antigo módulo Diabetes (tinham carboidratos) para cá
        const diabetes = await carregarDiabetes();
        const porRotulo: Record<string, TipoRefeicao> = {
          'café da manhã': 'cafe',
          'lanche da manhã': 'lanche_manha',
          almoço: 'almoco',
          'lanche da tarde': 'lanche_tarde',
          jantar: 'jantar',
          'lanche noturno': 'ceia',
        };
        const migradas: Refeicao[] = (diabetes.refeicoes ?? []).map((r) => {
          const tipo = porRotulo[(r.tipo ?? '').toLowerCase()] ?? 'outro';
          return {
            id: gerarId(),
            data: r.data,
            horario: r.horario,
            nome: r.alimentos?.trim() || r.tipo || traduzirAtual('ref.titulo'),
            kcal: 0,
            proteinaG: 0,
            carboidratoG: r.carboidratos,
            tipo,
            tipoPersonalizado: tipo === 'outro' ? r.tipo : undefined,
            observacoes: r.observacoes,
          };
        });
        d = { ...d, refeicoes: [...d.refeicoes, ...migradas], migradoRefeicoesDiabetes: true };
        await salvarRegistros(d);
      }
      dadosRef.current = d;
      setDados(d);
      setLoading(false);
    })();
  }, []);

  async function persistir(novosDados: RecordsData) {
    dadosRef.current = novosDados;
    setDados(novosDados);
    await salvarRegistros(novosDados);
  }

  const hoje = dataDeHoje();
  const refeicoesHoje = dados.refeicoes.filter((r) => r.data === hoje);
  const aguasHoje = dados.aguas
    .filter((a) => a.data === hoje)
    .sort((a, b) => (a.horario < b.horario ? 1 : -1));
  const aguaHojeMl = aguasHoje.reduce((soma, a) => soma + a.ml, 0);
  const kcalHoje = Math.round(refeicoesHoje.reduce((soma, r) => soma + r.kcal, 0));
  const proteinaHojeG = Math.round(refeicoesHoje.reduce((soma, r) => soma + r.proteinaG, 0) * 10) / 10;
  const carboidratoHojeG = Math.round(refeicoesHoje.reduce((soma, r) => soma + (r.carboidratoG ?? 0), 0));
  const gorduraHojeG = Math.round(refeicoesHoje.reduce((soma, r) => soma + (r.gorduraG ?? 0), 0));
  const fibraHojeG = Math.round(refeicoesHoje.reduce((soma, r) => soma + (r.fibraG ?? 0), 0));

  function nutrientesDoDia(data: string) {
    const doDia = dados.refeicoes.filter((r) => r.data === data);
    return { ...somarNutrientes(doDia), refeicoes: doDia.length };
  }

  const exerciciosHoje = dados.exercicios
    .filter((e) => e.data === hoje)
    .sort((a, b) => (a.horario < b.horario ? 1 : -1));
  const kcalGastaHoje = exerciciosHoje.reduce((soma, e) => soma + e.kcalGasto, 0);

  const pesosOrdenados = [...dados.pesos].sort((a, b) => (a.data < b.data ? 1 : -1));
  const pesoAtualKg = pesosOrdenados.length > 0 ? pesosOrdenados[0].pesoKg : null;

  async function adicionarRefeicao(nome: string, n: Nutrientes) {
    const horario = horarioAgora();
    const nova: Refeicao = {
      id: gerarId(),
      data: hoje,
      horario,
      nome,
      kcal: n.kcal,
      proteinaG: n.proteinaG,
      carboidratoG: n.carboidratoG,
      gorduraG: n.gorduraG,
      fibraG: n.fibraG,
      tipo: tipoPeloHorario(horario),
    };
    await persistir({ ...dadosRef.current, refeicoes: [...dadosRef.current.refeicoes, nova] });
  }

  async function salvarRefeicao(
    entrada: Omit<Refeicao, 'id'> & { id?: string },
    lembreteHoras?: number | null
  ): Promise<{ lembreteAgendado: boolean }> {
    const anterior = entrada.id ? dadosRef.current.refeicoes.find((r) => r.id === entrada.id) : undefined;
    if (anterior?.fotoUri && anterior.fotoUri !== entrada.fotoUri) await apagarFoto(anterior.fotoUri);
    const final: Refeicao = { ...entrada, id: anterior?.id ?? gerarId() };
    const refeicoes = anterior
      ? dadosRef.current.refeicoes.map((r) => (r.id === final.id ? final : r))
      : [...dadosRef.current.refeicoes, final];

    // lembrete da próxima refeição: substitui o pendente
    let lembreteRefeicaoId = dadosRef.current.lembreteRefeicaoId ?? null;
    let lembreteAgendado = false;
    if (lembreteHoras && lembreteHoras > 0) {
      await cancelarLembreteRefeicao(lembreteRefeicaoId);
      const [a, m, d] = final.data.split('-').map(Number);
      const [h, min] = final.horario.split(':').map(Number);
      const quando = new Date(a, m - 1, d, h, min);
      quando.setHours(quando.getHours() + lembreteHoras);
      lembreteRefeicaoId = await agendarLembreteRefeicao(
        quando,
        traduzirAtual('ref.notifTitulo'),
        traduzirAtual('ref.notifCorpo', { h: lembreteHoras })
      );
      lembreteAgendado = !!lembreteRefeicaoId;
    }
    await persistir({ ...dadosRef.current, refeicoes, lembreteRefeicaoId });
    return { lembreteAgendado };
  }

  async function removerRefeicao(id: string) {
    await apagarFoto(dadosRef.current.refeicoes.find((r) => r.id === id)?.fotoUri);
    await persistir({ ...dadosRef.current, refeicoes: dadosRef.current.refeicoes.filter((r) => r.id !== id) });
  }

  async function adicionarAgua(ml: number) {
    const novo: RegistroAgua = { id: gerarId(), data: hoje, horario: horarioAgora(), ml };
    await persistir({ ...dadosRef.current, aguas: [...dadosRef.current.aguas, novo] });
  }

  async function removerAgua(id: string) {
    await persistir({ ...dadosRef.current, aguas: dadosRef.current.aguas.filter((a) => a.id !== id) });
  }

  // Uma pesagem por dia: pesar de novo no mesmo dia substitui o valor
  async function adicionarPeso(pesoKg: number) {
    const novo: RegistroPeso = { id: gerarId(), data: hoje, pesoKg };
    await persistir({ ...dadosRef.current, pesos: [...dadosRef.current.pesos.filter((p) => p.data !== hoje), novo] });
  }

  async function removerPeso(id: string) {
    await persistir({ ...dadosRef.current, pesos: dadosRef.current.pesos.filter((p) => p.id !== id) });
  }

  async function adicionarExercicio(
    nome: string,
    duracaoMin: number,
    kcalGasto: number,
    detalhes?: { intensidade?: string; local?: string; grupoMuscular?: string }
  ) {
    const novo: RegistroExercicio = {
      id: gerarId(),
      data: hoje,
      horario: horarioAgora(),
      nome,
      duracaoMin,
      kcalGasto,
      intensidade: detalhes?.intensidade,
      local: detalhes?.local,
      grupoMuscular: detalhes?.grupoMuscular,
    };
    await persistir({ ...dadosRef.current, exercicios: [...dadosRef.current.exercicios, novo] });
  }

  async function removerExercicio(id: string) {
    await persistir({ ...dadosRef.current, exercicios: dadosRef.current.exercicios.filter((e) => e.id !== id) });
  }

  return (
    <RecordsContext.Provider
      value={{
        loading,
        refeicoesHoje,
        aguasHoje,
        aguaHojeMl,
        aguas: dados.aguas,
        kcalHoje,
        proteinaHojeG,
        pesoAtualKg,
        pesos: [...pesosOrdenados].reverse(),
        exerciciosHoje,
        kcalGastaHoje,
        adicionarRefeicao,
        salvarRefeicao,
        refeicoes: dados.refeicoes,
        carboidratoHojeG,
        gorduraHojeG,
        fibraHojeG,
        nutrientesDoDia,
        removerRefeicao,
        adicionarAgua,
        removerAgua,
        adicionarPeso,
        removerPeso,
        adicionarExercicio,
        removerExercicio,
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
