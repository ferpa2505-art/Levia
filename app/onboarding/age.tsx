import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { Input } from '@components/Input';
import { ThemedText } from '@components/ThemedText';
import { useProfile } from '@context/ProfileContext';
import { spacing } from '@constants/colors';

export default function OnboardingAge() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [idade, setIdade] = useState(profile.idade ? String(profile.idade) : '');

  const idadeNum = parseInt(idade, 10);
  const valido = !isNaN(idadeNum) && idadeNum >= 13 && idadeNum <= 100;

  function handleNext() {
    if (!valido) return;
    updateProfile({ idade: idadeNum });
    router.push('/onboarding/sex');
  }

  return (
    <QuestionLayout
      step={5}
      totalSteps={8}
      question="Qual a sua idade?"
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={!valido}
    >
      <View style={{ width: '100%', alignItems: 'center' }}>
        <Input
          value={idade}
          onChangeText={setIdade}
          placeholder="0"
          keyboardType="number-pad"
          autoFocus
          maxLength={3}
          returnKeyType="next"
          onSubmitEditing={handleNext}
        />
        <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.sm }}>
          anos
        </ThemedText>
      </View>
    </QuestionLayout>
  );
}
