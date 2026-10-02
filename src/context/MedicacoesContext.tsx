import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Medicacao, MedicacoesData, UsoMedicacao } from '@models/medicacoes';
import { medicacoesVazias, UNIDADES_DOSE } from '@models/medicacoes';
import type { RegistroMedicacao } from '@models/diabetes';
import { gerarId } from '@utils/recordsStorage';
import { carregarDiabetes } from '@utils/diabetesStorage';
import {
  agendarNotificacoes,
  cancelarNotificacoes,
  criarEventos,
  removerEventos,
} from '@utils/agendaMedicacao';
import { usePreferences } from '@context/PreferencesContext';

const CHAVE = 'levia:medicacoes';

export type DadosMedicacao = Omit<Medicacao, 'id' | 'notificationIds' | 'calendarEventIds' | 'criadaEm'> & {
  id?: string;
};

export interface ResultadoSalvar {
  lembretesAgendados: number;
  calendarioNegado: boolean;
  eventosCriados: number;
}

interface MedicacoesContextValue {
  loading: boolean;
  medicacoes: Medicacao[];
  salvarMedicacao: (dados: DadosMedicacao) => Promise<ResultadoSalvar>;
  removerMedicacao: (id: string) => Promise<void>;
}

const MedicacoesContext = createContext<MedicacoesContextValue | undefined>(undefined);

const INTERVALO_ANTIGO: Record<string, number> = {
  hora: 1, '2h': 2, '3h': 3, '4h': 4, '6h': 6, '8h': 8, '12h': 12, diaria: 24, quinzenal: 24, mensal: 24,
};

/** Converte as medicações do antigo módulo Diabetes para o novo formato (sem perder nada) */
function migrarDoDiabetes(antigas: RegistroMedicacao[]): { novas: Medicacao[]; idsAntigos: string[] } {
  const vistos = new Set<string>();
  const novas: Medicacao[] = [];
  const idsAntigos: string[] = [];
  for (const a of antigas) {
    idsAntigos.push(...(a.alarme?.notificationIds ?? []));
    const chave = `${a.medicamento}|${a.dosagem}`.toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    const m = (a.dosagem ?? '').trim().match(/^([\d.,/]+)\s*(.*)$/);
    const unidade = UNIDADES_DOSE.find((u) => u.codigo.toLowerCase() === (m?.[2] ?? '').toLowerCase())?.codigo ?? 'mg';
    const alarme = a.alarme?.ativado ? a.alarme : undefined;
    const uso: UsoMedicacao = alarme ? 'continuo' : 'esporadico';
    novas.push({
      id: gerarId(),
      nome: a.medicamento,
      dose: m ? m[1] : a.dosagem ?? '',
      unidade,
      uso,
      frequencia: alarme?.frequencia === 'semanal' ? 'semanal' : 'horas',
      intervaloHoras: alarme ? INTERVALO_ANTIGO[alarme.frequencia] ?? 24 : undefined,
      primeiraDose: alarme?.horarios?.[0],
      observacoes: a.observacoes,
      lembretes: !!alarme?.notificacaoAtivada,
      calendario: false,
      notificationIds: [],
      calendarEventIds: [],
      criadaEm: new Date().toISOString(),
    });
  }
  return { novas, idsAntigos };
}

export function MedicacoesProvider({ children }: { children: ReactNode }) {
  const { t, idioma } = usePreferences();
  const [dados, setDados] = useState<MedicacoesData>(medicacoesVazias);
  // sempre a versão mais nova dos dados (evita perder registros em toques rápidos)
  const dadosRef = useRef(dados);
  const [loading, setLoading] = useState(true);

  async function persistir(novo: MedicacoesData) {
    dadosRef.current = novo;
    setDados(novo);
    await AsyncStorage.setItem(CHAVE, JSON.stringify(novo)).catch(() => {});
  }

  useEffect(() => {
    (async () => {
      let salvo = medicacoesVazias;
      try {
        const raw = await AsyncStorage.getItem(CHAVE);
        if (raw) salvo = { ...medicacoesVazias, ...JSON.parse(raw) };
      } catch {
        // mantém vazio
      }
      if (!salvo.migradoDoDiabetes) {
        const diabetes = await carregarDiabetes();
        const { novas, idsAntigos } = migrarDoDiabetes(diabetes.medicacoes ?? []);
        await cancelarNotificacoes(idsAntigos);
        const agendadas: Medicacao[] = [];
        for (const m of novas) {
          agendadas.push({ ...m, notificationIds: await agendarNotificacoes(m, t('med.notifTitulo'), idioma) });
        }
        salvo = { medicacoes: [...salvo.medicacoes, ...agendadas], migradoDoDiabetes: true };
        await AsyncStorage.setItem(CHAVE, JSON.stringify(salvo)).catch(() => {});
      }
      dadosRef.current = salvo;
      setDados(salvo);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvarMedicacao(entrada: DadosMedicacao): Promise<ResultadoSalvar> {
    const anterior = entrada.id ? dadosRef.current.medicacoes.find((m) => m.id === entrada.id) : undefined;
    if (anterior) {
      await cancelarNotificacoes(anterior.notificationIds);
      await removerEventos(anterior.calendarEventIds);
    }
    const base: Medicacao = {
      ...entrada,
      id: anterior?.id ?? gerarId(),
      notificationIds: [],
      calendarEventIds: [],
      criadaEm: anterior?.criadaEm ?? new Date().toISOString(),
    };
    const notificationIds = await agendarNotificacoes(base, t('med.notifTitulo'), idioma);
    const eventos = await criarEventos(base, t('med.notifTitulo'), idioma);
    const final: Medicacao = { ...base, notificationIds, calendarEventIds: eventos.ids };
    const lista = anterior
      ? dadosRef.current.medicacoes.map((m) => (m.id === final.id ? final : m))
      : [...dadosRef.current.medicacoes, final];
    await persistir({ ...dadosRef.current, medicacoes: lista });
    return {
      lembretesAgendados: notificationIds.length,
      calendarioNegado: !eventos.permitido,
      eventosCriados: eventos.ids.length,
    };
  }

  async function removerMedicacao(id: string) {
    const m = dadosRef.current.medicacoes.find((x) => x.id === id);
    if (m) {
      await cancelarNotificacoes(m.notificationIds);
      await removerEventos(m.calendarEventIds);
    }
    await persistir({ ...dadosRef.current, medicacoes: dadosRef.current.medicacoes.filter((x) => x.id !== id) });
  }

  return (
    <MedicacoesContext.Provider value={{ loading, medicacoes: dados.medicacoes, salvarMedicacao, removerMedicacao }}>
      {children}
    </MedicacoesContext.Provider>
  );
}

export function useMedicacoes() {
  const ctx = useContext(MedicacoesContext);
  if (!ctx) throw new Error('useMedicacoes precisa estar dentro de MedicacoesProvider');
  return ctx;
}
