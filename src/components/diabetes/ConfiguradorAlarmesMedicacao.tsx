import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, TextInput } from 'react-native';
import type { RegistroMedicacao, FrequenciaAlarme, TipoMedicacao, ConfiguracaoAlarme } from '@/types/diabetes';
import { colors } from '@constants/colors';
import { Clock, Bell } from 'lucide-react-native';
import { gerarHorariosPorFrequencia, normalizarHorario } from '@hooks/useMedicacaoAlarmes';
import { enviarLembreteTeste } from '@utils/diabetesNotifications';
import { useTranslation } from '@/i18n';

interface Props {
  medicacao: RegistroMedicacao;
  onConfirm: (alarme: ConfiguracaoAlarme) => void;
  onCancel: () => void;
}

export const ConfiguradorAlarmesMedicacao: React.FC<Props> = ({
  medicacao,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  const FREQUENCIAS: { label: string; value: FrequenciaAlarme }[] = [
    { label: t('med.frequencia.hora'), value: 'hora' },
    { label: t('med.frequencia.2h'), value: '2h' },
    { label: t('med.frequencia.3h'), value: '3h' },
    { label: t('med.frequencia.4h'), value: '4h' },
    { label: t('med.frequencia.6h'), value: '6h' },
    { label: t('med.frequencia.8h'), value: '8h' },
    { label: t('med.frequencia.12h'), value: '12h' },
    { label: t('med.frequencia.diaria'), value: 'diaria' },
    { label: t('med.frequencia.semanal'), value: 'semanal' },
    { label: t('med.frequencia.quinzenal'), value: 'quinzenal' },
    { label: t('med.frequencia.mensal'), value: 'mensal' },
  ];

  const DIAS_SEMANA = [
    { label: t('comum.dias.dom'), value: 0 },
    { label: t('comum.dias.seg'), value: 1 },
    { label: t('comum.dias.ter'), value: 2 },
    { label: t('comum.dias.qua'), value: 3 },
    { label: t('comum.dias.qui'), value: 4 },
    { label: t('comum.dias.sex'), value: 5 },
    { label: t('comum.dias.sab'), value: 6 },
  ];
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
  const [primeiroHorario, setPrimeiroHorario] = useState(alarme.horarios?.[0] ?? '08:00');
  const horarioValido = normalizarHorario(primeiroHorario) != null;

  const handleMudarHorario = (texto: string) => {
    setPrimeiroHorario(texto);
    const normalizado = normalizarHorario(texto);
    if (normalizado) {
      setAlarme((atual) => ({ ...atual, horarios: gerarHorariosPorFrequencia(atual.frequencia, normalizado) }));
    }
  };

  const handleTestar = async () => {
    const ok = await enviarLembreteTeste(medicacao);
    Alert.alert(
      ok ? t('med.alarme.testeEnviado') : t('med.alarme.notificacoesBloqueadas'),
      ok
        ? t('med.alarme.fecheApp')
        : t('med.alarme.permitaNotificacoes')
    );
  };

  const ehMedicacaoDiabetes = medicacao.tipo === 'insulina' || medicacao.tipo === 'diabetes-tratamento';
  const ehUsoContinum = alarme.usoContinuo;

  // Determinar se frequência e notificação são obrigatórias
  const frequenciaObrigatoria = ehMedicacaoDiabetes || ehUsoContinum;
  const notificacaoObrigatoria = ehMedicacaoDiabetes || ehUsoContinum;

  const handleAtivarAlarme = (ativo: boolean) => {
    if (ativo && frequenciaObrigatoria && !alarme.frequencia) {
      Alert.alert(t('med.alarme.campoObrigatorio'), t('med.alarme.selecioneFrequencia'));
      return;
    }
    setAlarme({ ...alarme, ativado: ativo });
  };

  const handleMudarFrequencia = (freq: FrequenciaAlarme) => {
    setFrequenciaSelecionada(freq);
    const horarios = gerarHorariosPorFrequencia(freq, normalizarHorario(primeiroHorario) ?? alarme.horarios?.[0]);
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
      Alert.alert(t('comum.erro'), t('med.alarme.frequenciaObrigatoria'));
      return;
    }

    if (notificacaoObrigatoria && !alarme.notificacaoAtivada) {
      Alert.alert(t('comum.erro'), t('med.alarme.notificacaoObrigatoria'));
      return;
    }

    if (!horarioValido) {
      Alert.alert(t('med.alarme.horarioInvalido'), t('med.alarme.formatoHorario'));
      return;
    }

    if (!alarme.horarios || alarme.horarios.length === 0) {
      Alert.alert(t('comum.erro'), t('med.alarme.minimoUmHorario'));
      return;
    }

    onConfirm(alarme);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{t('med.alarme.titulo')}</Text>
      <Text style={styles.medicamento}>{medicacao.medicamento} - {medicacao.dosagem}</Text>

      <ScrollView style={styles.conteudo} showsVerticalScrollIndicator={false}>
        {/* Section: Medication Type */}
        <View style={styles.secao}>
          <Text style={styles.tipoMedicacao}>
            {ehMedicacaoDiabetes ? t('med.tipo.diabetes') : t('med.tipo.outra')}
          </Text>
          {!ehMedicacaoDiabetes && (
            <View style={styles.campoContinuo}>
              <Text style={styles.label}>{t('med.usoContinuo')}</Text>
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
                  {alarme.usoContinuo ? t('med.simUsoContinuo') : t('med.naoOcasional')}
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
              {alarme.ativado ? t('med.alarme.ativado') : t('med.alarme.desativado')}
            </Text>
          </View>
        </View>

        {alarme.ativado && (
          <>
            {/* Seção: Frequência (obrigatória se diabetes ou uso contínuo) */}
            <View style={styles.secao}>
              <Text style={[styles.label, frequenciaObrigatoria && styles.obrigatorio]}>
                {t('med.alarme.frequencia')} {frequenciaObrigatoria ? t('comum.obrigatorio') : t('comum.opcional')}
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

            {/* Seção: Primeiro horário (os demais são calculados a partir dele) */}
            <View style={styles.secao}>
              <Text style={styles.label}>{t('med.alarme.horario')} (HH:MM):</Text>
              <TextInput
                value={primeiroHorario}
                onChangeText={handleMudarHorario}
                placeholder="08:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                style={[styles.horarioInput, !horarioValido && styles.horarioInputErro]}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Seção: Horários Sugeridos */}
            <View style={styles.secao}>
              <Text style={styles.label}>{t('med.horariosParaTomar') || 'Horários para tomar:'}</Text>
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
                      Alert.alert(t('comum.naoPermitido'), t('med.alarme.notificacaoObrigatoria'));
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
                    {t('med.notificacao')} {notificacaoObrigatoria ? t('comum.obrigatorio') : t('comum.opcional')}
                  </Text>
                </View>
              </View>
              {alarme.notificacaoAtivada && (
                <Text style={styles.textoAjuda}>
                  💬 {t('med.voceReceberaLembretes')}
                </Text>
              )}
              <TouchableOpacity style={styles.botaoTeste} onPress={handleTestar}>
                <Text style={styles.botaoTesteTexto}>🔔 {t('med.alarme.teste')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Botões de Ação */}
      <View style={styles.botoes}>
        <TouchableOpacity style={styles.btnCancelar} onPress={onCancel}>
          <Text style={styles.textoCancelar}>{t('comum.cancelar')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnConfirmar} onPress={handleConfirm}>
          <Text style={styles.textoConfirmar}>{t('med.alarme.salvar')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  horarioInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 18,
    color: colors.text,
    width: 120,
  },
  horarioInputErro: { borderColor: colors.error },
  botaoTeste: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botaoTesteTexto: { color: colors.primary, fontWeight: '600' },
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
