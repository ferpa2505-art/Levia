import { View, Pressable, StyleSheet } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { useFitness } from '@context/FitnessContext';
import { useT } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';

export default function HistoricoFitness() {
  const t = useT();
  const { sessoes, removerSessao } = useFitness();

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        {sessoes.length === 0 && (
          <ThemedText variant="body" color="textSecondary">{t('fitness.semHistorico')}</ThemedText>
        )}
        {sessoes.map((s) => {
          const feitas = s.series.filter((x) => x.feita).length;
          const minutos = Math.max(
            0,
            Math.round((new Date(s.fim).getTime() - new Date(s.inicio).getTime()) / 60000)
          );
          return (
            <ThemedView key={s.id} variant="surface" style={styles.card}>
              <View style={styles.linha}>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="subheading" color="text">{s.nomeTreino}</ThemedText>
                  <ThemedText variant="small" color="textSecondary">
                    {s.data} · {feitas}/{s.series.length} · {minutos} min
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => removerSessao(s.id)}
                  hitSlop={8}
                  accessibilityLabel={t('fitness.excluirTreino')}
                >
                  <Trash2 size={18} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
              </View>
            </ThemedView>
          );
        })}
      </ThemedView>
    </TelaRolavel>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.lg },
  linha: { flexDirection: 'row', alignItems: 'center' },
});
