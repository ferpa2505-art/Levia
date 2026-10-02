import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import {
  Glp1Data,
  glp1DadosVazios,
  RegistroDoseGLP1,
  RegistroSintomaGLP1,
  NivelIntensidadeSintoma,
  NivelApetite,
  RegistroApetite,
} from '@models/glp1';
import { carregarGlp1, salvarGlp1 } from '@utils/glp1Storage';
import { dataDeHoje, horarioAgora, gerarId } from '@utils/recordsStorage';
import { agendarLembreteDose, cancelarLembreteDose } from '@utils/glp1Notifications';
import { LOCAIS_APLICACAO } from '@constants/glp1';

function combinarDataHorario(data: string, horario: string): Date {
  const [ano, mes, dia] = data.split('-').map(Number);
  const [hora, minuto] = horario.split(':').map(Number);
  return new Date(ano, mes - 1, dia, hora, minuto);
}

function adicionarDiasNaData(base: Date, dias: number): Date {
  const nova = new Date(base);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function ordenarPorDataHorarioDesc<T extends { data: string; horario: string }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => (a.data + a.horario < b.data + b.horario ? 1 : -1));
}

/**
 * Sugere o próximo local de aplicação, ciclando pela lista de locais
 * a partir do último usado — evita repetir sempre o mesmo ponto.
 */
function calcularLocalSugerido(doses: RegistroDoseGLP1[]): string {
  if (doses.length === 0) return LOCAIS_APLICACAO[0];
  const ultimoLocal = ordenarPorDataHorarioDesc(doses)[0].local;
  const indexUltimo = LOCAIS_APLICACAO.indexOf(ultimoLocal);
  const proximoIndex = indexUltimo === -1 ? 0 : (indexUltimo + 1) % LOCAIS_APLICACAO.length;
  return LOCAIS_APLICACAO[proximoIndex];
}

interface Glp1ContextValue {
  loading: boolean;
  doses: RegistroDoseGLP1[];
  sintomas: RegistroSintomaGLP1[];
  configCaneta: Glp1Data['configCaneta'];
  configLembrete: Glp1Data['configLembrete'];
  ultimaDose: RegistroDoseGLP1 | null;
  proximaDoseData: Date | null;
  diasAteProximaDose: number | null;
  localSugerido: string;
  adicionarDose: (
    medicamento: string,
    dosagemMg: number,
    local: string,
    observacoes?: string
  ) => Promise<void>;
  removerDose: (id: string) => Promise<void>;
  adicionarSintoma: (
    sintoma: string,
    intensidade: NivelIntensidadeSintoma,
    observacoes?: string
  ) => Promise<void>;
  removerSintoma: (id: string) => Promise<void>;
  /** Mais recente primeiro */
  apetites: RegistroApetite[];
  apetiteHoje: RegistroApetite | null;
  registrarApetite: (nivel: NivelApetite, observacoes?: string) => Promise<void>;
  removerApetite: (id: string) => Promise<void>;
  atualizarConfigCaneta: (mgTotalCaneta: number | null, cliquesTotaisCaneta: number | null) => Promise<void>;
  atualizarConfigLembrete: (ativo: boolean, frequenciaDias: number) => Promise<void>;
}

const Glp1Context = createContext<Glp1ContextValue | undefined>(undefined);

export function Glp1Provider({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<Glp1Data>(glp1DadosVazios);
  // sempre a versão mais nova dos dados (evita perder registros em toques rápidos)
  const dadosRef = useRef(dados);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarGlp1().then((d) => {
      dadosRef.current = d;
      setDados(d);
      setLoading(false);
    });
  }, []);

  async function persistir(novosDados: Glp1Data) {
    dadosRef.current = novosDados;
    setDados(novosDados);
    await salvarGlp1(novosDados);
  }

  const dosesOrdenadas = ordenarPorDataHorarioDesc(dados.doses);
  const ultimaDose = dosesOrdenadas.length > 0 ? dosesOrdenadas[0] : null;

  const proximaDoseData = ultimaDose
    ? adicionarDiasNaData(
        combinarDataHorario(ultimaDose.data, ultimaDose.horario),
        dados.configLembrete.frequenciaDias
      )
    : null;

  const diasAteProximaDose = proximaDoseData
    ? Math.ceil((proximaDoseData.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const localSugerido = calcularLocalSugerido(dados.doses);

  // Cancela o lembrete antigo e agenda um novo com base no estado mais
  // recente (última dose + frequência escolhida). Chamado sempre que uma
  // dose é adicionada/removida ou a configuração de lembrete muda.
  async function reagendarLembrete(dadosAtualizados: Glp1Data) {
    await cancelarLembreteDose(dadosAtualizados.configLembrete.notificationId);

    if (!dadosAtualizados.configLembrete.ativo) {
      return { ...dadosAtualizados.configLembrete, notificationId: null };
    }

    const ultima = ordenarPorDataHorarioDesc(dadosAtualizados.doses)[0] ?? null;
    if (!ultima) {
      return { ...dadosAtualizados.configLembrete, notificationId: null };
    }

    const proxima = adicionarDiasNaData(
      combinarDataHorario(ultima.data, ultima.horario),
      dadosAtualizados.configLembrete.frequenciaDias
    );
    const notificationId = await agendarLembreteDose(proxima);
    return { ...dadosAtualizados.configLembrete, notificationId };
  }

  async function adicionarDose(
    medicamento: string,
    dosagemMg: number,
    local: string,
    observacoes?: string
  ) {
    const nova: RegistroDoseGLP1 = {
      id: gerarId(),
      data: dataDeHoje(),
      horario: horarioAgora(),
      medicamento,
      dosagemMg,
      local,
      observacoes: observacoes?.trim() || undefined,
    };
    const intermediario: Glp1Data = { ...dadosRef.current, doses: [...dadosRef.current.doses, nova] };
    const configLembrete = await reagendarLembrete(intermediario);
    await persistir({ ...intermediario, configLembrete });
  }

  async function removerDose(id: string) {
    const intermediario: Glp1Data = { ...dadosRef.current, doses: dadosRef.current.doses.filter((d) => d.id !== id) };
    const configLembrete = await reagendarLembrete(intermediario);
    await persistir({ ...intermediario, configLembrete });
  }

  async function adicionarSintoma(
    sintoma: string,
    intensidade: NivelIntensidadeSintoma,
    observacoes?: string
  ) {
    const novo: RegistroSintomaGLP1 = {
      id: gerarId(),
      data: dataDeHoje(),
      horario: horarioAgora(),
      sintoma,
      intensidade,
      observacoes: observacoes?.trim() || undefined,
    };
    await persistir({ ...dadosRef.current, sintomas: [...dadosRef.current.sintomas, novo] });
  }

  async function removerSintoma(id: string) {
    await persistir({ ...dadosRef.current, sintomas: dadosRef.current.sintomas.filter((s) => s.id !== id) });
  }

  // Um registro por dia: salvar de novo no mesmo dia substitui o anterior
  async function registrarApetite(nivel: NivelApetite, observacoes?: string) {
    const hoje = dataDeHoje();
    const novo: RegistroApetite = {
      id: gerarId(),
      data: hoje,
      horario: horarioAgora(),
      nivel,
      observacoes: observacoes?.trim() || undefined,
    };
    await persistir({ ...dadosRef.current, apetites: [...dadosRef.current.apetites.filter((a) => a.data !== hoje), novo] });
  }

  async function removerApetite(id: string) {
    await persistir({ ...dadosRef.current, apetites: dadosRef.current.apetites.filter((a) => a.id !== id) });
  }

  async function atualizarConfigCaneta(mgTotalCaneta: number | null, cliquesTotaisCaneta: number | null) {
    await persistir({ ...dadosRef.current, configCaneta: { mgTotalCaneta, cliquesTotaisCaneta } });
  }

  async function atualizarConfigLembrete(ativo: boolean, frequenciaDias: number) {
    const intermediario: Glp1Data = {
      ...dadosRef.current,
      configLembrete: { ...dadosRef.current.configLembrete, ativo, frequenciaDias },
    };
    const configLembrete = await reagendarLembrete(intermediario);
    await persistir({ ...intermediario, configLembrete });
  }

  return (
    <Glp1Context.Provider
      value={{
        loading,
        doses: dosesOrdenadas,
        sintomas: ordenarPorDataHorarioDesc(dados.sintomas),
        configCaneta: dados.configCaneta,
        configLembrete: dados.configLembrete,
        ultimaDose,
        proximaDoseData,
        diasAteProximaDose,
        localSugerido,
        adicionarDose,
        removerDose,
        adicionarSintoma,
        removerSintoma,
        apetites: ordenarPorDataHorarioDesc(dados.apetites),
        apetiteHoje: dados.apetites.find((a) => a.data === dataDeHoje()) ?? null,
        registrarApetite,
        removerApetite,
        atualizarConfigCaneta,
        atualizarConfigLembrete,
      }}
    >
      {children}
    </Glp1Context.Provider>
  );
}

export function useGlp1() {
  const ctx = useContext(Glp1Context);
  if (!ctx) {
    throw new Error('useGlp1 precisa ser usado dentro de um Glp1Provider');
  }
  return ctx;
}
