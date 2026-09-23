import { useState } from 'react';
import { useRouter } from 'expo-router';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { Input } from '@components/Input';
import { useProfile } from '@context/ProfileContext';
import { useT } from '@context/PreferencesContext';

export default function OnboardingName() {
  const t = useT();
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
      question={t('onb.nome.pergunta')}
      subtitle={t('onb.nome.sub')}
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={nome.trim().length === 0}
    >
      <Input
        value={nome}
        onChangeText={setNome}
        placeholder={t('onb.nome.ph')}
        autoFocus
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={handleNext}
      />
    </QuestionLayout>
  );
}
