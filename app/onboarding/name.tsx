import { useState } from 'react';
import { useRouter } from 'expo-router';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { Input } from '@components/Input';
import { useProfile } from '@context/ProfileContext';

export default function OnboardingName() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [nome, setNome] = useState(profile.nome);

  function handleNext() {
    const nomeLimpo = nome.trim();
    updateProfile({ nome: nomeLimpo, comoChamar: nomeLimpo.split(' ')[0] });
    router.push('/onboarding/nickname');
  }

  return (
    <QuestionLayout
      step={0}
      totalSteps={8}
      question="Qual é o seu nome?"
      subtitle="Pra gente te chamar do jeito certo daqui pra frente."
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={nome.trim().length === 0}
    >
      <Input
        value={nome}
        onChangeText={setNome}
        placeholder="Seu nome"
        autoFocus
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={handleNext}
      />
    </QuestionLayout>
  );
}
