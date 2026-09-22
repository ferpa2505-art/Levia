import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { OptionPill } from '@components/onboarding/OptionPill';
import { useProfile } from '@context/ProfileContext';
import { SexoBiologico } from '@models/profile';

export default function OnboardingSex() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [sexo, setSexo] = useState<SexoBiologico | null>(profile.sexoBiologico);

  function handleNext() {
    if (!sexo) return;
    updateProfile({ sexoBiologico: sexo });
    router.push('/onboarding/goal');
  }

  return (
    <QuestionLayout
      step={6}
      totalSteps={8}
      question="Qual o seu sexo biológico?"
      subtitle="Usamos isso só  para calcular sua faixa de peso saudável com precisão."
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={!sexo}
    >
      <View style={{ width: '100%' }}>
        <OptionPill label="Feminino" selected={sexo === 'feminino'} onPress={() => setSexo('feminino')} />
        <OptionPill label="Masculino" selected={sexo === 'masculino'} onPress={() => setSexo('masculino')} />
      </View>
    </QuestionLayout>
  );
}
