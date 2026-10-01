import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { colors } from '@constants/colors';
import { ProfileProvider, useProfile } from '@context/ProfileContext';
import { RecordsProvider } from '@context/RecordsContext';
import { CustomRecipesProvider } from '@context/CustomRecipesContext';
import { NewsProvider } from '@context/NewsContext';
import { Glp1Provider } from '@context/Glp1Context';
import { DiabetesProvider } from '@context/DiabetesContext';
import { PreferencesProvider, usePreferences } from '@context/PreferencesContext';
import { OmniRouteProvider } from '@context/OmniRouteContext';

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { profile, loading } = useProfile();
  const { t } = usePreferences();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    SplashScreen.hideAsync();

    const emOnboarding = segments[0] === 'onboarding';
    if (!profile.onboardingConcluido && !emOnboarding) {
      router.replace('/onboarding');
    }
  }, [loading, profile.onboardingConcluido, segments]);

  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="recipe-builder" options={{ headerShown: true, title: t('titulos.receitas') }} />
      <Stack.Screen name="glp1" options={{ headerShown: true, title: t('titulos.glp1') }} />
      <Stack.Screen name="diabetes" options={{ headerShown: true, title: t('titulos.diabetes') }} />
    </Stack>
  );
}

/**
 * Quando o tema muda, a "key" muda e a navegação é remontada —
 * assim todas as telas são redesenhadas com as cores novas.
 */
function NavegacaoComTema() {
  const { tema } = usePreferences();
  return <RootNavigation key={tema} />;
}

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <ProfileProvider>
        <OmniRouteProvider>
          <RecordsProvider>
            <CustomRecipesProvider>
              <NewsProvider>
                <Glp1Provider>
                  <DiabetesProvider>
                    <NavegacaoComTema />
                  </DiabetesProvider>
                </Glp1Provider>
              </NewsProvider>
            </CustomRecipesProvider>
          </RecordsProvider>
        </OmniRouteProvider>
      </ProfileProvider>
    </PreferencesProvider>
  );
}
