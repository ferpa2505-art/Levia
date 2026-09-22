import { View, ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { LeviaLogo } from '@components/LeviaLogo';
import { colors, spacing, radius } from '@constants/colors';

export default function HomeScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <ThemedView style={styles.container}>
        {/* Saudação */}
        <View style={styles.greeting}>
          <View style={styles.greetingRow}>
            <LeviaLogo variant="outline" size={34} />
            <ThemedText variant="title" color="primary" style={styles.greetingTitle}>
              Olá! 👋
            </ThemedText>
          </View>
          <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            Bem-vindo ao seu acompanhamento de saúde
          </ThemedText>
        </View>

        {/* Card de Resumo do Dia */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text">
            Resumo de Hoje
          </ThemedText>

          <View style={styles.statsGrid}>
            <View style={[styles.statChip, { backgroundColor: 'rgba(111,165,142,0.12)' }]}>
              <ThemedText variant="heading" color="primary">
                0
              </ThemedText>
              <ThemedText variant="small" color="textSecondary">
                kcal
              </ThemedText>
            </View>

            <View style={[styles.statChip, { backgroundColor: 'rgba(244,169,131,0.18)' }]}>
              <ThemedText variant="heading" color="secondary">
                0
              </ThemedText>
              <ThemedText variant="small" color="textSecondary">
                g proteína
              </ThemedText>
            </View>

            <View style={[styles.statChip, { backgroundColor: 'rgba(183,166,224,0.18)' }]}>
              <ThemedText variant="heading" color="accent">
                0
              </ThemedText>
              <ThemedText variant="small" color="textSecondary">
                ml água
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Card de Peso */}
        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text">
            Seu Peso
          </ThemedText>
          <ThemedText variant="title" color="primary" style={{ marginVertical: spacing.md }}>
            -- kg
          </ThemedText>
          <ThemedText variant="small" color="textSecondary">
            Última pesagem: --
          </ThemedText>
        </ThemedView>

        {/* CTA Onboarding */}
        <Button
          label="Começar Configuração"
          variant="primary"
          size="lg"
          onPress={() => {}}
          style={{ marginTop: spacing.xl, borderRadius: radius.full }}
        />

        {/* Status */}
        <View style={styles.status}>
          <ThemedText variant="caption" color="textSecondary">
            v0.1.0 • Fase 1 de Desenvolvimento
          </ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greeting: {
    marginBottom: spacing['2xl'],
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingTitle: {
    marginLeft: spacing.sm,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
  },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs / 2,
    borderRadius: radius.lg,
  },
  status: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
});
