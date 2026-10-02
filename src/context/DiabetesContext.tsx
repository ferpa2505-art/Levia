import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type {
  DiabetesData,
  RegistroGlicemia,
  RegistroMedicacao,
  RegistroRefeicao,
  NotaDiaria,
  ConfiguracaoAlarme,
  ConfigDiabetes,
} from '@/types/diabetes';
import { diabetesDadosVazios } from '@/types/diabetes';
import { dataDeHoje, horarioAgora, gerarId } from '@utils/recordsStorage';
import { carregarDiabetes, salvarDiabetes } from '@utils/diabetesStorage';
import {
  agendarAlarmesMedicacao,
  cancelarAlarmesMedicacao,
  agendarLembreteGlicemia,
} from '@utils/diabetesNotifications';
import { valorMgDl, media, momentoGlicemia } from '@utils/glicemia';
import { traduzirAtual } from '@/i18n';

interface DiabetesContextValue {
  loading: boolean;
  config: ConfigDiabetes;
  atualizarConfig: (mudancas: Partial<ConfigDiabetes>) => Promise<void>;
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
  /** Devolve quantos lembretes ficaram agendados no aparelho */
  atualizarAlarmeMedicacao: (medicacaoId: string, alarme: ConfiguracaoAlarme) => Promise<number>;
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
  const [dados, setDados] = useState<DiabetesData>(diabetesDadosVazios);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDiabetes().then((salvos) => {
      setDados(salvos);
      setLoading(false);
    });
  }, []);

  // Grava no aparelho a cada mudança, depois que os dados salvos já foram carregados
  useEffect(() => {
    if (loading) return;
    salvarDiabetes(dados).catch(() => {});
  }, [dados, loading]);

  const hoje = dataDeHoje();
  const glicemiaHoje = dados.glicemias.filter((g) => g.data === hoje);
  const ultimaGlicemia = glicemiaHoje.length > 0 ? glicemiaHoje[glicemiaHoje.length - 1] : null;
  // média sempre em mg/dL (medições em mmol/L são convertidas)
  const mediaGlicemiaHoje = media(glicemiaHoje.map(valorMgDl));

  /**
   * Cancela o lembrete de medição atual e, se estiver ativo, agenda o próximo
   * `lembreteHoras` depois da última medição (ou de agora, se não houver).
   */
  async function reagendarLembreteMedicao(config: ConfigDiabetes, glicemias: RegistroGlicemia[]) {
    await cancelarAlarmesMedicacao(config.lembreteNotificationId ? [config.lembreteNotificationId] : []);
    if (!config.lembreteAtivo) return { ...config, lembreteNotificationId: null };
    const ultima = [...glicemias].sort((a, b) => momentoGlicemia(b).getTime() - momentoGlicemia(a).getTime())[0];
    let base = ultima ? momentoGlicemia(ultima) : new Date();
    // se o horário já passou (ex.: última medição antiga), conta a partir de agora
    if (base.getTime() + config.lembreteHoras * 3600_000 <= Date.now()) base = new Date();
    const id = await agendarLembreteGlicemia(
      config.lembreteHoras,
      base,
      traduzirAtual('gl.notifTitulo'),
      traduzirAtual('gl.notifCorpo', { h: config.lembreteHoras })
    );
    return { ...config, lembreteNotificationId: id };
  }

  async function atualizarConfig(mudancas: Partial<ConfigDiabetes>) {
    const novaConfig = await reagendarLembreteMedicao({ ...dados.config, ...mudancas }, dados.glicemias);
    setDados((prev) => ({ ...prev, config: novaConfig }));
  }

  async function adicionarGlicemia(valor: number, unidade: string, notas?: string) {
    const novoRegistro: RegistroGlicemia = {
      id: gerarId(),
      data: dataDeHoje(),
      horario: horarioAgora(),
      valor,
      unidade: unidade as 'mg/dL' | 'mmol/L',
      notas,
    };
    const glicemias = [...dados.glicemias, novoRegistro];
    const config = await reagendarLembreteMedicao(dados.config, glicemias);
    setDados((prev) => ({ ...prev, config, glicemias: [...prev.glicemias, novoRegistro] }));
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
    await cancelarAlarmesMedicacao(dados.medicacoes.find((m) => m.id === id)?.alarme?.notificationIds);
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

  async function atualizarAlarmeMedicacao(medicacaoId: string, alarme: ConfiguracaoAlarme): Promise<number> {
    const medicacao = dados.medicacoes.find((m) => m.id === medicacaoId);
    if (medicacao) {
      const anteriores = medicacao.alarme?.notificationIds;
      const notificationIds = await agendarAlarmesMedicacao({
        ...medicacao,
        alarme: { ...alarme, notificationIds: anteriores },
      });
      alarme = { ...alarme, notificationIds };
    }
    setDados((prev) => ({
      ...prev,
      medicacoes: prev.medicacoes.map((med) =>
        med.id === medicacaoId ? { ...med, alarme } : med
      ),
    }));
    return alarme.notificationIds?.length ?? 0;
  }

  return (
    <DiabetesContext.Provider
      value={{
        loading,
        config: dados.config,
        atualizarConfig,
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
        atualizarAlarmeMedicacao,
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
