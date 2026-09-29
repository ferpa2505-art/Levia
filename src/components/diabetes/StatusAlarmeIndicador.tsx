import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RegistroMedicacao } from '@types/diabetes';
import { colors } from '@constants/colors';
import { Clock, AlertCircle } from 'lucide-react-native';
import { calcularProximoAlarme, ProximoAlarmeInfo } from '@hooks/useMedicacaoAlarmes';

interface Props {
  medicacao: RegistroMedicacao;
}

export const StatusAlarmeIndicador: React.FC<Props> = ({ medicacao }) => {
  const proximo = calcularProximoAlarme(medicacao);

  if (!medicacao.alarme?.ativado) {
    return (
      <View style={styles.container}>
        <AlertCircle size={14} color={colors.textSecondary} />
        <Text style={styles.textoDesativado}>Sem alarme</Text>
      </View>
    );
  }

  if (!proximo) {
    return null;
  }

  const label = proximo.emMinutos < 60
    ? `${proximo.emMinutos}min`
    : `${Math.floor(proximo.emMinutos / 60)}h`;

  return (
    <View style={styles.container}>
      <Clock size={14} color={colors.success} />
      <Text style={styles.textoProximo}>
        Próx. às {proximo.proximoHorario}
      </Text>
      <Text style={styles.tempo}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 6,
    marginTop: 8,
  },
  textoDesativado: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  textoProximo: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  tempo: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: `${colors.success}20`,
    borderRadius: 4,
  },
});
