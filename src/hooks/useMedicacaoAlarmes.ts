import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import type { RegistroMedicacao, FrequenciaAlarme } from '@/types/diabetes';

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

/**
 * Gera horários baseado na frequência
 */
export const gerarHorariosPorFrequencia = (frequencia: FrequenciaAlarme, horarioInicial?: string): string[] => {
  const horarios: string[] = [];
  const inicio = horarioInicial ? parseInt(horarioInicial.split(':')[0]) : 8;

  switch (frequencia) {
    case 'hora':
      // A cada hora
      for (let h = 0; h < 24; h++) {
        horarios.push(`${String(h).padStart(2, '0')}:00`);
      }
      break;

    case '2h':
      // A cada 2 horas
      for (let h = inicio; h < 24; h += 2) {
        horarios.push(`${String(h).padStart(2, '0')}:00`);
      }
      break;

    case '3h':
      // A cada 3 horas
      for (let h = inicio; h < 24; h += 3) {
        horarios.push(`${String(h).padStart(2, '0')}:00`);
      }
      break;

    case '4h':
      // A cada 4 horas
      for (let h = inicio; h < 24; h += 4) {
        horarios.push(`${String(h).padStart(2, '0')}:00`);
      }
      break;

    case '6h':
      // A cada 6 horas (06:00, 12:00, 18:00, 00:00)
      horarios.push('06:00', '12:00', '18:00', '00:00');
      break;

    case '8h':
      // A cada 8 horas (08:00, 16:00, 00:00)
      horarios.push('08:00', '16:00', '00:00');
      break;

    case '12h':
      // A cada 12 horas (08:00, 20:00)
      horarios.push('08:00', '20:00');
      break;

    case 'diaria':
      // Uma vez por dia
      horarios.push(horarioInicial || '08:00');
      break;

    case 'semanal':
      // Uma vez por semana
      horarios.push(horarioInicial || '08:00');
      break;

    case 'quinzenal':
      // A cada 15 dias
      horarios.push(horarioInicial || '08:00');
      break;

    case 'mensal':
      // Uma vez por mês
      horarios.push(horarioInicial || '08:00');
      break;
  }

  return horarios;
};

/**
 * Enviar notificação de lembretes de medicação
 */
export const enviarNotificacaoMedicacao = async (medicacao: RegistroMedicacao) => {
  if (!medicacao.alarme?.notificacaoAtivada) {
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Lembrete de Medicação',
        body: `Horário de tomar ${medicacao.medicamento} (${medicacao.dosagem})`,
        data: {
          medicacaoId: medicacao.id,
          tipo: medicacao.tipo,
        },
        sound: 'default',
      },
      trigger: {
        seconds: 60,
      } as any,
    });
  } catch (error) {
    console.error('Erro ao agendar notificação:', error);
  }
};

/**
 * Hook para gerenciar alarmes de medicações
 */
export const useMedicacaoAlarmes = (medicacoes: RegistroMedicacao[]) => {
  useEffect(() => {
    const verificarAlarmes = () => {
      medicacoes.forEach((medicacao) => {
        if (medicacao.alarme?.ativado) {
          const proximo = calcularProximoAlarme(medicacao);
          if (proximo && proximo.emMinutos <= 1) {
            enviarNotificacaoMedicacao(medicacao);
          }
        }
      });
    };

    // Verificar a cada minuto
    const intervalo = setInterval(verificarAlarmes, 60000);

    return () => clearInterval(intervalo);
  }, [medicacoes]);
};
