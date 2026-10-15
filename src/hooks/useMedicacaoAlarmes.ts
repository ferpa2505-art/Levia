import type { RegistroMedicacao, FrequenciaAlarme } from '@/types/diabetes';

// Os lembretes de verdade são agendados em @utils/diabetesNotifications.
// Aqui ficam só os cálculos usados pela tela.

export interface ProximoAlarmeInfo {
  proximoHorario: string;
  emMinutos: number;
  medicamento: string;
}

/**
 * Calcula quantos minutos faltam até o próximo alarme
 */
export const calcularProximoAlarme = (medicacao: RegistroMedicacao): ProximoAlarmeInfo | null => {
  if (!medicacao.alarme?.ativado || !medicacao.alarme?.horarios?.length) {
    return null;
  }

  const agora = new Date();
  const horaAtualStr = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

  // Buscar próximo horário
  for (const horario of medicacao.alarme.horarios.sort()) {
    if (horario > horaAtualStr) {
      const [horas, minutos] = horario.split(':').map(Number);
      const proximoHorario = new Date();
      proximoHorario.setHours(horas, minutos, 0);

      const diferenca = proximoHorario.getTime() - agora.getTime();
      const emMinutos = Math.ceil(diferenca / (1000 * 60));

      if (emMinutos > 0) {
        return {
          proximoHorario: horario,
          emMinutos,
          medicamento: medicacao.medicamento,
        };
      }
    }
  }

  // Se nenhum horário encontrado hoje, retorna o primeiro de amanhã
  const primeiroHorario = medicacao.alarme.horarios[0];
  const [horas, minutos] = primeiroHorario.split(':').map(Number);
  const proximoHorario = new Date();
  proximoHorario.setDate(proximoHorario.getDate() + 1);
  proximoHorario.setHours(horas, minutos, 0);

  const diferenca = proximoHorario.getTime() - agora.getTime();
  const emMinutos = Math.ceil(diferenca / (1000 * 60));

  return {
    proximoHorario: primeiroHorario,
    emMinutos,
    medicamento: medicacao.medicamento,
  };
};

const INTERVALO_HORAS: Partial<Record<FrequenciaAlarme, number>> = {
  hora: 1,
  '2h': 2,
  '3h': 3,
  '4h': 4,
  '6h': 6,
  '8h': 8,
  '12h': 12,
};

/** "8:5" ou "08:05" → "08:05"; devolve null se não for um horário válido */
export const normalizarHorario = (texto: string): string | null => {
  const m = texto.trim().match(/^(\d{1,2})[:h.]?(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

/**
 * Gera os horários do dia a partir do primeiro horário escolhido.
 * Ex.: a cada 8h começando 07:30 → 07:30, 15:30, 23:30.
 * Frequências diária/semanal/quinzenal/mensal usam só o horário escolhido.
 */
export const gerarHorariosPorFrequencia = (frequencia: FrequenciaAlarme, horarioInicial?: string): string[] => {
  const inicio = normalizarHorario(horarioInicial ?? '') ?? '08:00';
  const intervalo = INTERVALO_HORAS[frequencia];
  if (!intervalo) return [inicio];

  const [h, min] = inicio.split(':').map(Number);
  const horarios: string[] = [];
  for (let k = 0; k < 24 / intervalo; k++) {
    const hora = (h + k * intervalo) % 24;
    horarios.push(`${String(hora).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return horarios.sort();
};
