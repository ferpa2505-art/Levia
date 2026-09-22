import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { Input } from '@components/Input';
import { ThemedText } from '@components/ThemedText';
import { useProfile } from '@context/ProfileContext';
import { spacing } from '@constants/colors';

export default function OnboardingWeight() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [peso, setPeso] = useState(profile.pesoAtualKg ? String(profile.pesoAtualKg) : '');

  const pesoNum = parseFloat(peso.replace(',', '.'));
  const valido = !isNaN(pesoNum) && pesoNum >= 30 && pesoNum <= 300;

  function handleNext() {
    if (!valido) return;
    updateProfile({ pesoAtualKg: pesoNum });
    router.push('/onboarding/age');
  }

  return (
    <QuestionLayout
      step={4}
      totalSteps={8}
      question="Qual o seu peso atual?"
      subtitle="Sem julgamentos — é só o ponto de partida."
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={!valido}
    >
      <View style={{ width: '100%', alignItems: 'center' }}>
        <Input
          value={peso}
          onChangeText={setPeso}
          placeholder="0"
          keyboardType="decimal-pad"
          autoFocus
          maxLength={5}
          returnKeyType="next"
          onSubmitEditing={handleNext}
        />
        <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.sm }}>
          quilos
        </ThemedText>
      </View>
    </QuestionLayout>
  );
}
