import { useState } from 'react';
import { useRouter } from 'expo-router';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { Input } from '@components/Input';
import { useProfile } from '@context/ProfileContext';
import { useT } from '@context/PreferencesContext';

export default function OnboardingNickname() {
  const t = useT();
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [comoChamar, setComoChamar] = useState(profile.comoChamar);

  function handleNext() {
    updateProfile({ comoChamar: comoChamar.trim() || profile.nome.split(' ')[0] });
    router.push('/onboarding/pronoun');
  }

  return (
    <QuestionLayout
      step={1}
      totalSteps={8}
      question={t('onb.apelido.pergunta')}
      subtitle={t('onb.apelido.sub')}
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={comoChamar.trim().length === 0}
    >
      <Input
        value={comoChamar}
        onChangeText={setComoChamar}
        placeholder={t('onb.apelido.ph')}
        autoFocus
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={handleNext}
      />
    </QuestionLayout>
  );
}
