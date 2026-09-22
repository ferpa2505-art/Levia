import { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { ThemedText } from '@components/ThemedText';
import { useProfile } from '@context/ProfileContext';
import { calcularFaixaSaudavel } from '@utils/profileStorage';
import { colors, spacing, radius } from '@constants/colors';

const PASSO_KG = 0.5;

export default function OnboardingGoal() {
  const router = useRouter();
  const { profile, finalizarOnboarding } = useProfile();

  const faixa = useMemo(
    () => calcularFaixaSaudavel(profile.alturaCm ?? 165),
    [profile.alturaCm]
  );

  const metaInicial =
    profile.metaPesoKg ?? Math.round(((faixa.min + faixa.max) / 2) * 2) / 2;

  const [meta, setMeta] = useState(metaInicial);

  const foraDaFaixa = meta < faixa.min || meta > faixa.max;

  async function handleConfirmar() {
    await finalizarOnboarding({ metaPesoKg: meta });
    router.replace('/');
  }

  return (
    <QuestionLayout
      step={7}
      totalSteps={8}
      question={`Qual sua meta de peso, ${profile.comoChamar || ''}?`}
      subtitle={`Com sua altura, a faixa saudável fica entre ${faixa.min} kg e ${faixa.max} kg. Escolha onde quer chegar — você pode ajustar isso depois, a qualquer momento.`}
      onNext={handleConfirmar}
      onBack={() => router.back()}
      nextLabel="Confirmar meta"
    >
      <View style={styles.stepper}>
        <Pressable style={styles.stepButton} onPress={() => setMeta((v) => Math.round((v - PASSO_KG) * 10) / 10)}>
          <ThemedText variant="heading" color="primary">−</ThemedText>
        </Pressable>

        <View style={styles.valueBox}>
          <ThemedText variant="title" color="primary">{meta.toFixed(1)}</ThemedText>
          <ThemedText variant="small" color="textSecondary">kg</ThemedText>
        </View>

        <Pressable style={styles.stepButton} onPress={() => setMeta((v) => Math.round((v + PASSO_KG) * 10) / 10)}>
          <ThemedText variant="heading" color="primary">+</ThemedText>
        </Pressable>
      </View>

      {foraDaFaixa ? (
        <ThemedText variant="small" color="textSecondary" style={styles.aviso}>
          Essa meta está fora da faixa saudável sugerida — tudo bem, é a sua
          escolha. Conversar com um profissional de saúde pode ajudar a
          ajustar esse número com segurança.
        </ThemedText>
      ) : null}
    </QuestionLayout>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepButton: {
    width: 48, height: 48, borderRadius: radius.full,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  valueBox: { alignItems: 'center', marginHorizontal: spacing.xl, minWidth: 100 },
  aviso: { textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.md },
});
