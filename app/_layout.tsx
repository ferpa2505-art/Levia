import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { colors } from '@constants/colors';
import { ProfileProvider, useProfile } from '@context/ProfileContext';
import { RecordsProvider } from '@context/RecordsContext';
import { CustomRecipesProvider } from '@context/CustomRecipesContext';
import { NewsProvider } from '@context/NewsContext';
import { Glp1Provider } from '@context/Glp1Context';

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { profile, loading } = useProfile();
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
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="recipe-builder" options={{ headerShown: true, title: 'Minhas receitas' }} />
      <Stack.Screen name="glp1" options={{ headerShown: true, title: 'Modo GLP-1' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ProfileProvider>
      <RecordsProvider>
        <CustomRecipesProvider>
          <NewsProvider>
            <Glp1Provider>
              <RootNavigation />
            </Glp1Provider>
          </NewsProvider>
        </CustomRecipesProvider>
      </RecordsProvider>
    </ProfileProvider>
  );
}
