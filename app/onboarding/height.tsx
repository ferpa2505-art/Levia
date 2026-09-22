import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { Input } from '@components/Input';
import { ThemedText } from '@components/ThemedText';
import { useProfile } from '@context/ProfileContext';
import { spacing } from '@constants/colors';

export default function OnboardingHeight() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [altura, setAltura] = useState(profile.alturaCm ? String(profile.alturaCm) : '');

  const alturaNum = parseInt(altura, 10);
  const valido = !isNaN(alturaNum) && alturaNum >= 100 && alturaNum <= 250;

  function handleNext() {
    if (!valido) return;
    updateProfile({ alturaCm: alturaNum });
    router.push('/onboarding/weight');
  }

  return (
    <QuestionLayout
      step={3}
      totalSteps={8}
      question={`Qual a sua altura, ${profile.comoChamar || ''}?`}
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={!valido}
    >
      <View style={{ width: '100%', alignItems: 'center' }}>
        <Input
          value={altura}
          onChangeText={setAltura}
          placeholder="0"
          keyboardType="number-pad"
          autoFocus
          maxLength={3}
          returnKeyType="next"
          onSubmitEditing={handleNext}
        />
        <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.sm }}>
          centímetros
        </ThemedText>
      </View>
    </QuestionLayout>
  );
}
