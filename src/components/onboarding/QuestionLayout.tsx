import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { colors, spacing } from '@constants/colors';
import { estilosTema } from '@theme/estilos';
import { useT } from '@context/PreferencesContext';

interface QuestionLayoutProps {
  step: number;
  totalSteps: number;
  question: string;
  subtitle?: string;
  children: ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export function QuestionLayout({
  step,
  totalSteps,
  question,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel,
  nextDisabled = false,
}: QuestionLayoutProps) {
  const t = useT();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.progressDots}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View key={i} style={[styles.dot, i <= step ? styles.dotActive : styles.dotInactive]} />
            ))}
          </View>

          <View style={styles.questionBlock}>
            <ThemedText variant="title" color="text" style={styles.question}>
              {question}
            </ThemedText>
            {subtitle ? (
              <ThemedText variant="body" color="textSecondary" style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.answerBlock}>{children}</View>
        </ScrollView>

        <View style={styles.footer}>
          {onBack ? (
            <Button label={t('comum.voltar')} variant="outline" onPress={onBack} style={styles.backButton} />
          ) : null}
          <Button
            label={nextLabel ?? t('comum.continuar')}
            variant="primary"
            size="lg"
            onPress={onNext}
            disabled={nextDisabled}
            style={styles.nextButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = estilosTema(() => ({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing['3xl'] },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  dotActive: { backgroundColor: colors.primary },
  dotInactive: { backgroundColor: colors.border },
  questionBlock: { marginBottom: spacing['2xl'] },
  question: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: spacing.sm },
  answerBlock: { alignItems: 'center' },
  footer: { padding: spacing.xl },
  backButton: { marginBottom: spacing.md },
  nextButton: {},
}));
