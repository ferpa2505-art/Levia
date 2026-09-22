import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { QuestionLayout } from '@components/onboarding/QuestionLayout';
import { OptionPill } from '@components/onboarding/OptionPill';
import { useProfile } from '@context/ProfileContext';
import { Pronome } from '@models/profile';

export default function OnboardingPronoun() {
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
      question="Qual pronome você prefere que a gente use?"
      subtitle="Assim o app fala com você do jeito certo."
      onNext={handleNext}
      onBack={() => router.back()}
      nextDisabled={!pronome}
    >
      <View style={{ width: '100%' }}>
        <OptionPill label="Ela" selected={pronome === 'ela'} onPress={() => setPronome('ela')} />
        <OptionPill label="Ele" selected={pronome === 'ele'} onPress={() => setPronome('ele')} />
      </View>
    </QuestionLayout>
  );
}
