import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cofre } from '@utils/cofre';
import type {
  Configuracoes,
  DadosFitness,
  Equipamento,
  Exercicio,
  Pesagem,
  Plano,
  Rotina,
  SerieRealizada,
  Sessao,
} from '@/types/fitness';
import { CONFIG_PADRAO, PLANO_VAZIO } from '@/types/fitness';
import { BIBLIOTECA_EXERCICIOS } from '@constants/exerciciosFitness';
import { criarPlanoInicial, PlanoInicialId, trocarDias as trocarDiasPlano } from '@utils/fitnessLogica';
import { gerarId } from '@utils/recordsStorage';

const CHAVE = 'levia:fitness:v2';
const CHAVE_ANTIGA = 'levia:fitness';

const DADOS_VAZIOS: DadosFitness = {
  personalizados: [],
  favoritos: [],
  rotinas: [],
  plano: PLANO_VAZIO,
  sessoes: [],
  pesagens: [],
  config: CONFIG_PADRAO,
};

/** Formato da primeira versão do Guia (treinos fixos por nome), convertido sem perder dados. */
interface DadosV1 {
  treinos?: { id: string; nome: string; criadoEm: string; exercicios: { exercicioId: string; series: number; repeticoes: number; cargaKg?: number; descansoSeg: number }[] }[];
  sessoes?: { id: string; treinoId: string; nomeTreino: string; data: string; inicio: string; fim: string; series: SerieRealizada[] }[];
}

function migrarV1(antigo: DadosV1): DadosFitness {
  const rotinas: Rotina[] = (antigo.treinos ?? []).map((t) => ({
    id: t.id,
    nome: t.nome,
    criadaEm: t.criadoEm,
    exercicios: t.exercicios.map((e) => ({
      exercicioId: e.exercicioId,
      series: e.series,
      repMin: e.repeticoes,
      repMax: e.repeticoes,
      descansoSeg: e.descansoSeg,
      progressao: 'nenhuma' as const,
    })),
  }));
  const sessoes: Sessao[] = (antigo.sessoes ?? []).map((s) => ({
    id: s.id,
    data: s.data,
    rotinaId: s.treinoId,
    nome: s.nomeTreino,
    inicio: s.inicio,
    fim: s.fim,
    series: s.series.map((x) => ({ ...x, tipo: 'trabalho' as const })),
  }));
  return { ...DADOS_VAZIOS, rotinas, sessoes };
}

function normalizar(bruto: Partial<DadosFitness>): DadosFitness {
  return {
    personalizados: bruto.personalizados ?? [],
    favoritos: bruto.favoritos ?? [],
    rotinas: bruto.rotinas ?? [],
    plano: bruto.plano ?? PLANO_VAZIO,
    sessoes: bruto.sessoes ?? [],
    pesagens: bruto.pesagens ?? [],
    metaPesoKg: bruto.metaPesoKg,
    config: { ...CONFIG_PADRAO, ...(bruto.config ?? {}) },
  };
}

export interface EntradaRotina {
  id?: string;
  nome: string;
  exercicios: Rotina['exercicios'];
}

interface FitnessContextValue extends DadosFitness {
  loading: boolean;
  /** Biblioteca embutida + exercícios personalizados */
  exercicios: Exercicio[];
  grupoDe: (exercicioId: string) => Exercicio['grupo'] | undefined;
  exercicioPorId: (id: string) => Exercicio | undefined;
  salvarRotina: (entrada: EntradaRotina) => Promise<void>;
  removerRotina: (id: string) => Promise<void>;
  copiarRotina: (id: string) => Promise<void>;
  definirDia: (indice: number, rotinaId: string | null) => Promise<void>;
  trocarDias: (a: number, b: number) => Promise<void>;
  aplicarPlanoInicial: (id: PlanoInicialId) => Promise<void>;
  adicionarPersonalizado: (entrada: { nome: string; grupo: Exercicio['grupo']; equipamento: Equipamento; tipo: Exercicio['tipo'] }) => Promise<string>;
  removerPersonalizado: (id: string) => Promise<void>;
  alternarFavorito: (id: string) => Promise<void>;
  registrarSessao: (sessao: Omit<Sessao, 'id'> & { id?: string }) => Promise<void>;
  removerSessao: (id: string) => Promise<void>;
  adicionarPesagem: (kg: number, data?: string) => Promise<void>;
  removerPesagem: (id: string) => Promise<void>;
  salvarConfig: (parcial: Partial<Configuracoes>) => Promise<void>;
  definirMetaPeso: (kg: number | undefined) => Promise<void>;
  exportarJson: () => string;
  importarJson: (texto: string) => Promise<void>;
}

const FitnessContext = createContext<FitnessContextValue | undefined>(undefined);

export function FitnessProvider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<DadosFitness>(DADOS_VAZIOS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await cofre.lerDado(CHAVE);
        if (raw) {
          setDados(normalizar(JSON.parse(raw)));
        } else {
          const antigo = await cofre.lerDado(CHAVE_ANTIGA);
          if (antigo) setDados(migrarV1(JSON.parse(antigo) as DadosV1));
        }
      } catch {
        // dados corrompidos: começa vazio sem apagar nada do disco
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persistir(novo: DadosFitness) {
    setDados(novo);
    await cofre.gravarDado(CHAVE, JSON.stringify(novo)).catch(() => {});
  }

  const exercicios = useMemo(() => [...BIBLIOTECA_EXERCICIOS, ...dados.personalizados], [dados.personalizados]);
  const mapa = useMemo(() => new Map(exercicios.map((e) => [e.id, e])), [exercicios]);

  async function salvarRotina(entrada: EntradaRotina) {
    const existente = entrada.id ? dados.rotinas.find((r) => r.id === entrada.id) : undefined;
    const rotina: Rotina = {
      id: entrada.id ?? gerarId(),
      nome: entrada.nome,
      exercicios: entrada.exercicios,
      criadaEm: existente?.criadaEm ?? new Date().toISOString(),
    };
    const rotinas = existente
      ? dados.rotinas.map((r) => (r.id === rotina.id ? rotina : r))
      : [...dados.rotinas, rotina];
    await persistir({ ...dados, rotinas });
  }

  async function removerRotina(id: string) {
    const plano: Plano = { semana: dados.plano.semana.map((r) => (r === id ? null : r)) };
    await persistir({ ...dados, rotinas: dados.rotinas.filter((r) => r.id !== id), plano });
  }

  async function copiarRotina(id: string) {
    const origem = dados.rotinas.find((r) => r.id === id);
    if (!origem) return;
    const copia: Rotina = {
      ...origem,
      id: gerarId(),
      nome: `${origem.nome} (cópia)`,
      criadaEm: new Date().toISOString(),
    };
    await persistir({ ...dados, rotinas: [...dados.rotinas, copia] });
  }

  async function definirDia(indice: number, rotinaId: string | null) {
    const semana = [...dados.plano.semana];
    semana[indice] = rotinaId;
    await persistir({ ...dados, plano: { semana } });
  }

  async function trocarDias(a: number, b: number) {
    await persistir({ ...dados, plano: trocarDiasPlano(dados.plano, a, b) });
  }

  async function aplicarPlanoInicial(id: PlanoInicialId) {
    const { rotinas, plano } = criarPlanoInicial(id, new Date().toISOString());
    // ids novos a cada aplicação: aplicar o mesmo plano duas vezes não sobrescreve nada
    const trocas = new Map(rotinas.map((r) => [r.id, gerarId()]));
    const novas = rotinas.map((r) => ({ ...r, id: trocas.get(r.id) ?? r.id }));
    const semana = plano.semana.map((r) => (r ? trocas.get(r) ?? r : null));
    await persistir({ ...dados, rotinas: [...dados.rotinas, ...novas], plano: { semana } });
  }

  async function adicionarPersonalizado(entrada: { nome: string; grupo: Exercicio['grupo']; equipamento: Equipamento; tipo: Exercicio['tipo'] }) {
    const id = `custom-${gerarId()}`;
    const novo: Exercicio = { id, nome: entrada.nome.trim(), grupo: entrada.grupo, equipamento: entrada.equipamento, tipo: entrada.tipo, personalizado: true };
    await persistir({ ...dados, personalizados: [...dados.personalizados, novo] });
    return id;
  }

  async function removerPersonalizado(id: string) {
    await persistir({
      ...dados,
      personalizados: dados.personalizados.filter((e) => e.id !== id),
      favoritos: dados.favoritos.filter((f) => f !== id),
    });
  }

  async function alternarFavorito(id: string) {
    const favoritos = dados.favoritos.includes(id)
      ? dados.favoritos.filter((f) => f !== id)
      : [...dados.favoritos, id];
    await persistir({ ...dados, favoritos });
  }

  async function registrarSessao(entrada: Omit<Sessao, 'id'> & { id?: string }) {
    const sessao: Sessao = { ...entrada, id: entrada.id ?? gerarId() };
    const sessoes = entrada.id
      ? dados.sessoes.map((s) => (s.id === sessao.id ? sessao : s))
      : [sessao, ...dados.sessoes];
    await persistir({ ...dados, sessoes });
  }

  async function removerSessao(id: string) {
    await persistir({ ...dados, sessoes: dados.sessoes.filter((s) => s.id !== id) });
  }

  async function adicionarPesagem(kg: number, data?: string) {
    const nova: Pesagem = { id: gerarId(), kg, data: data ?? new Date().toISOString().slice(0, 10) };
    await persistir({ ...dados, pesagens: [nova, ...dados.pesagens] });
  }

  async function removerPesagem(id: string) {
    await persistir({ ...dados, pesagens: dados.pesagens.filter((p) => p.id !== id) });
  }

  async function salvarConfig(parcial: Partial<Configuracoes>) {
    await persistir({ ...dados, config: { ...dados.config, ...parcial } });
  }

  async function definirMetaPeso(kg: number | undefined) {
    await persistir({ ...dados, metaPesoKg: kg });
  }

  function exportarJson() {
    return JSON.stringify({ app: 'leviã-guia-treinos', versao: 2, dados }, null, 2);
  }

  async function importarJson(texto: string) {
    const bruto = JSON.parse(texto) as { app?: string; dados?: Partial<DadosFitness> };
    if (bruto.app !== 'leviã-guia-treinos' || !bruto.dados) throw new Error('arquivo-invalido');
    await persistir(normalizar(bruto.dados));
  }

  return (
    <FitnessContext.Provider
      value={{
        ...dados,
        loading,
        exercicios,
        grupoDe: (id) => mapa.get(id)?.grupo,
        exercicioPorId: (id) => mapa.get(id),
        salvarRotina,
        removerRotina,
        copiarRotina,
        definirDia,
        trocarDias,
        aplicarPlanoInicial,
        adicionarPersonalizado,
        removerPersonalizado,
        alternarFavorito,
        registrarSessao,
        removerSessao,
        adicionarPesagem,
        removerPesagem,
        salvarConfig,
        definirMetaPeso,
        exportarJson,
        importarJson,
      }}
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
