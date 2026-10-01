import { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { ThemedText } from '@components/ThemedText';
import { useProfile } from '@context/ProfileContext';
import { calcularFaixaSaudavel } from '@utils/profileStorage';
import { colors, spacing, radius } from '@constants/colors';
import { useT } from '@context/PreferencesContext';
import { estilosTema } from '@theme/estilos';

const PASSO_KG = 0.5;

export default function OnboardingGoal() {
  const t = useT();
  const router = useRouter();
  const { profile, updateProfile, finalizarOnboarding } = useProfile();

  const faixa = useMemo(
    () => calcularFaixaSaudavel(profile.alturaCm ?? 165),
    [profile.alturaCm]
  );

  const metaInicial =
    profile.metaPesoKg ?? Math.round(((faixa.min + faixa.max) / 2) * 2) / 2;

  const [meta, setMeta] = useState(metaInicial);

  const foraDaFaixa = meta < faixa.min || meta > faixa.max;

  async function handleConfirmar() {
    updateProfile({ metaPesoKg: meta });
    router.push('/onboarding/diabetes-type');
  }

  return (
    <QuestionLayout
      step={7}
      totalSteps={9}
      question={t('onb.meta.pergunta', { nome: profile.comoChamar || '' })}
      subtitle={t('onb.meta.sub', { min: faixa.min, max: faixa.max })}
      onNext={handleConfirmar}
      onBack={() => router.back()}
      nextLabel={t('onb.meta.confirmar')}
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
          {t('onb.meta.fora')}
        </ThemedText>
      ) : null}
    </QuestionLayout>
  );
}

const styles = estilosTema(() => ({
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepButton: {
    width: 48, height: 48, borderRadius: radius.full,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  valueBox: { alignItems: 'center', marginHorizontal: spacing.xl, minWidth: 100 },
  aviso: { textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.md },
}));
