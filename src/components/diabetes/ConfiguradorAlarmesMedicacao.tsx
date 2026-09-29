import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { RegistroMedicacao, FrequenciaAlarme, TipoMedicacao, ConfiguracaoAlarme } from '@types/diabetes';
import { colors } from '@constants/colors';
import { Clock, Bell } from 'lucide-react-native';
import { gerarHorariosPorFrequencia } from '@hooks/useMedicacaoAlarmes';

interface Props {
  medicacao: RegistroMedicacao;
  onConfirm: (alarme: ConfiguracaoAlarme) => void;
  onCancel: () => void;
}

const FREQUENCIAS: { label: string; value: FrequenciaAlarme }[] = [
  { label: 'A cada hora', value: 'hora' },
  { label: 'A cada 2 horas', value: '2h' },
  { label: 'A cada 3 horas', value: '3h' },
  { label: 'A cada 4 horas', value: '4h' },
  { label: 'A cada 6 horas', value: '6h' },
  { label: 'A cada 8 horas', value: '8h' },
  { label: 'A cada 12 horas', value: '12h' },
  { label: 'Diária', value: 'diaria' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'Quinzenal', value: 'quinzenal' },
  { label: 'Mensal', value: 'mensal' },
];

const DIAS_SEMANA = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sab', value: 6 },
];

export const ConfiguradorAlarmesMedicacao: React.FC<Props> = ({
  medicacao,
  onConfirm,
  onCancel,
}) => {
  const [alarme, setAlarme] = useState<ConfiguracaoAlarme>(
    medicacao.alarme || {
      ativado: false,
      frequencia: 'diaria',
      horarios: ['08:00'],
      notificacaoAtivada: true,
      usoContinuo: true,
    }
  );

  const [frequenciaSelecionada, setFrequenciaSelecionada] = useState<FrequenciaAlarme>(
    alarme.frequencia
  );

  const ehMedicacaoDiabetes = medicacao.tipo === 'insulina' || medicacao.tipo === 'diabetes-tratamento';
  const ehUsoContinum = alarme.usoContinuo;

  // Determinar se frequência e notificação são obrigatórias
  const frequenciaObrigatoria = ehMedicacaoDiabetes || ehUsoContinum;
  const notificacaoObrigatoria = ehMedicacaoDiabetes || ehUsoContinum;

  const handleAtivarAlarme = (ativo: boolean) => {
    if (ativo && frequenciaObrigatoria && !alarme.frequencia) {
      Alert.alert('Campo obrigatório', 'Selecione a frequência do alarme');
      return;
    }
    setAlarme({ ...alarme, ativado: ativo });
  };

  const handleMudarFrequencia = (freq: FrequenciaAlarme) => {
    setFrequenciaSelecionada(freq);
    const horarios = gerarHorariosPorFrequencia(freq, alarme.horarios?.[0]);
    setAlarme({
      ...alarme,
      frequencia: freq,
      horarios,
    });
  };

  const handleConfirm = () => {
    // Validação
    if (!alarme.ativado) {
      onConfirm(alarme);
      return;
    }

    if (frequenciaObrigatoria && !alarme.frequencia) {
      Alert.alert('Erro', 'Frequência é obrigatória para esta medicação');
      return;
    }

    if (notificacaoObrigatoria && !alarme.notificacaoAtivada) {
      Alert.alert('Erro', 'Notificações são obrigatórias para esta medicação');
      return;
    }

    if (!alarme.horarios || alarme.horarios.length === 0) {
      Alert.alert('Erro', 'Configure pelo menos um horário');
      return;
    }

    onConfirm(alarme);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>⏰ Configurar Alarme</Text>
      <Text style={styles.medicamento}>{medicacao.medicamento} - {medicacao.dosagem}</Text>

      <ScrollView style={styles.conteudo} showsVerticalScrollIndicator={false}>
        {/* Seção: Tipo de Medicação */}
        <View style={styles.secao}>
          <Text style={styles.tipoMedicacao}>
            {ehMedicacaoDiabetes ? '💉 Medicação de Diabetes' : '💊 Outra Medicação'}
          </Text>
          {!ehMedicacaoDiabetes && (
            <View style={styles.campoContinuo}>
              <Text style={styles.label}>Uso contínuo?</Text>
              <View style={styles.switchContainer}>
                <Switch
                  value={alarme.usoContinuo}
                  onValueChange={(val) =>
                    setAlarme({ ...alarme, usoContinuo: val })
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={alarme.usoContinuo ? colors.success : colors.textSecondary}
                />
                <Text style={styles.labelContinuo}>
                  {alarme.usoContinuo ? 'Sim, uso contínuo' : 'Não, ocasional'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Seção: Ativar Alarme */}
        <View style={styles.secao}>
          <View style={styles.switchContainer}>
            <Switch
              value={alarme.ativado}
              onValueChange={handleAtivarAlarme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={alarme.ativado ? colors.success : colors.textSecondary}
            />
            <Text style={styles.label}>
              {alarme.ativado ? '✓ Alarme ativado' : 'Alarme desativado'}
            </Text>
          </View>
        </View>

        {alarme.ativado && (
          <>
            {/* Seção: Frequência (obrigatória se diabetes ou uso contínuo) */}
            <View style={styles.secao}>
              <Text style={[styles.label, frequenciaObrigatoria && styles.obrigatorio]}>
                Frequência {frequenciaObrigatoria ? '(obrigatório)' : '(opcional)'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.frequenciasScroll}
              >
                {FREQUENCIAS.map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.frequenciaBtn,
                      frequenciaSelecionada === freq.value && styles.frequenciaBtnAtiva,
                    ]}
                    onPress={() => handleMudarFrequencia(freq.value)}
                  >
                    <Text
                      style={[
                        styles.frequenciaLabel,
                        frequenciaSelecionada === freq.value && styles.frequenciaLabelAtiva,
                      ]}
                    >
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Seção: Horários Sugeridos */}
            <View style={styles.secao}>
              <Text style={styles.label}>Horários para tomar:</Text>
              <View style={styles.horariosContainer}>
                {alarme.horarios?.map((horario, idx) => (
                  <View key={idx} style={styles.horarioTag}>
                    <Clock size={14} color={colors.text} />
                    <Text style={styles.horarioText}>{horario}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Seção: Notificação (obrigatória se diabetes ou uso contínuo) */}
            <View style={styles.secao}>
              <View style={styles.switchContainer}>
                <Switch
                  value={alarme.notificacaoAtivada}
                  onValueChange={(val) => {
                    if (!val && notificacaoObrigatoria) {
                      Alert.alert('Não permitido', 'Notificações são obrigatórias para esta medicação');
                      return;
                    }
                    setAlarme({ ...alarme, notificacaoAtivada: val });
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={alarme.notificacaoAtivada ? colors.success : colors.textSecondary}
                  disabled={notificacaoObrigatoria}
                />
                <View style={styles.notificacaoLabel}>
                  <Bell size={16} color={colors.primary} />
                  <Text style={[styles.label, notificacaoObrigatoria && styles.obrigatorio]}>
                    Notificação {notificacaoObrigatoria ? '(obrigatório)' : '(opcional)'}
                  </Text>
                </View>
              </View>
              {alarme.notificacaoAtivada && (
                <Text style={styles.textoAjuda}>
                  💬 Você receberá lembretes nos horários configurados
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Botões de Ação */}
      <View style={styles.botoes}>
        <TouchableOpacity style={styles.btnCancelar} onPress={onCancel}>
          <Text style={styles.textoCancelar}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnConfirmar} onPress={handleConfirm}>
          <Text style={styles.textoConfirmar}>Salvar Alarme</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  medicamento: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  conteudo: {
    marginBottom: 20,
  },
  secao: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  tipoMedicacao: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  campoContinuo: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  obrigatorio: {
    color: colors.error,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelContinuo: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  frequenciasScroll: {
    marginRight: -20,
    paddingRight: 20,
  },
  frequenciaBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  frequenciaBtnAtiva: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  frequenciaLabel: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  frequenciaLabelAtiva: {
    color: colors.surface,
    fontWeight: '700',
  },
  horariosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horarioTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  horarioText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  notificacaoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textoAjuda: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  botoes: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  textoCancelar: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  btnConfirmar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  textoConfirmar: {
    color: colors.surface,
    fontWeight: '700',
  },
});
