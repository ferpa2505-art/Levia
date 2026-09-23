import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { OptionPill } from '@components/onboarding/OptionPill';
import { useProfile } from '@context/ProfileContext';
import { Pronome } from '@models/profile';
import { useT } from '@context/PreferencesContext';

export default function OnboardingPronoun() {
  const t = useT();
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [pronome, setPronome] = useState<Pronome | null>(profile.pronome);

  function handleNext() {
    if (!pronome) return;
    updateProfile({ pronome });
    router.push('/onboarding/height');
  }

  return (
    <QuestionLayout
      step={2}
      totalSteps={8}
      question={t('onb.pronome.pergunta')}
      subtitle={t('onb.pronome.sub')}
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={!pronome}
    >
      <View style={{ width: '100%' }}>
        <OptionPill label={t('onb.pronome.ela')} selected={pronome === 'ela'} onPress={() => setPronome('ela')} />
        <OptionPill label={t('onb.pronome.ele')} selected={pronome === 'ele'} onPress={() => setPronome('ele')} />
      </View>
    </QuestionLayout>
  );
}
