import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@components/ThemedText';
import { LeviaLogo } from '@components/LeviaLogo';
import { colors, spacing, radius } from '@constants/colors';

export default function OnboardingWelcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <LeviaLogo variant="monochrome" size={110} />
          <ThemedText variant="title" style={styles.wordmark}>
            LEVIA
          </ThemedText>
          <ThemedText variant="body" style={styles.tagline}>
            Mais leve a cada dia.
          </ThemedText>
        </View>

        <View style={styles.footer}>
          <ThemedText variant="small" style={styles.footerText}>
            Antes de começar, vamos nos conhecer melhor — com calma, uma
            pergunta de cada vez.
          </ThemedText>
          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push('/onboarding/name')}
          >
            <ThemedText variant="subheading" color="primary">
              Vamos começar
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wordmark: { color: colors.background, letterSpacing: 4, marginTop: spacing.lg },
  tagline: { color: colors.background, fontStyle: 'italic', opacity: 0.9, marginTop: spacing.sm },
  footer: { padding: spacing.xl, alignItems: 'center' },
  footerText: { color: colors.background, opacity: 0.85, textAlign: 'center', marginBottom: spacing.lg },
  cta: {
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    width: '100%',
    alignItems: 'center',
  },
});
