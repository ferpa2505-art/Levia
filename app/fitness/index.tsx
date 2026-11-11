import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell, History, Pencil, Play, Plus } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { useFitness } from '@context/FitnessContext';
import { useT } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';

export default function FitnessDashboard() {
  const t = useT();
  const router = useRouter();
  const { treinos, loading } = useFitness();

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <View style={styles.topo}>
          <ThemedText variant="heading" color="text">{t('fitness.meusTreinos')}</ThemedText>
          <Pressable onPress={() => router.push('/fitness/historico')} hitSlop={8} style={styles.linkHistorico}>
            <History size={16} color={colors.primary} strokeWidth={2} />
            <ThemedText variant="small" color="primary" style={{ marginLeft: spacing.xs }}>
              {t('fitness.historico')}
            </ThemedText>
          </Pressable>
        </View>

        {!loading && treinos.length === 0 && (
          <ThemedView variant="surface" style={styles.card}>
            <ThemedText variant="body" color="textSecondary">{t('fitness.semTreinos')}</ThemedText>
          </ThemedView>
        )}

        {treinos.map((treino) => (
          <ThemedView key={treino.id} variant="surface" style={styles.card}>
            <View style={styles.linhaTreino}>
              <View style={styles.iconeCirculo}>
                <Dumbbell size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <ThemedText variant="subheading" color="text">{treino.nome}</ThemedText>
                <ThemedText variant="small" color="textSecondary">
                  {treino.exercicios.length} {t('fitness.exercicios')}
                </ThemedText>
              </View>
            </View>
            <View style={styles.acoes}>
              <Button
                label={t('fitness.iniciar')}
                size="sm"
                icon={<Play size={14} color={colors.background} strokeWidth={2} />}
                onPress={() => router.push(`/fitness/executar/${treino.id}`)}
                style={{ flex: 1 }}
              />
              <Button
                label={t('fitness.editar')}
                variant="outline"
                size="sm"
                icon={<Pencil size={14} color={colors.primary} strokeWidth={2} />}
                onPress={() => router.push(`/fitness/treino/${treino.id}`)}
                style={{ flex: 1 }}
              />
            </View>
          </ThemedView>
        ))}

        <Button
          label={t('fitness.novoTreino')}
          variant="outline"
          icon={<Plus size={16} color={colors.primary} strokeWidth={2} />}
          onPress={() => router.push('/fitness/treino/novo')}
        />
      </ThemedView>
    </TelaRolavel>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkHistorico: { flexDirection: 'row', alignItems: 'center' },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  linhaTreino: { flexDirection: 'row', alignItems: 'center' },
  iconeCirculo: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  acoes: { flexDirection: 'row', gap: spacing.sm },
});
