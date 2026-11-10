import '@utils/alertaWeb';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { colors, TEMAS_ESCUROS } from '@constants/colors';
import { ProfileProvider, useProfile } from '@context/ProfileContext';
import { RecordsProvider } from '@context/RecordsContext';
import { CustomRecipesProvider } from '@context/CustomRecipesContext';
import { NewsProvider } from '@context/NewsContext';
import { Glp1Provider } from '@context/Glp1Context';
import { DiabetesProvider } from '@context/DiabetesContext';
import { MedicacoesProvider } from '@context/MedicacoesContext';
import { SegurancaProvider, useSeguranca } from '@context/SegurancaContext';
import { PortaoSeguranca } from '@components/seguranca/PortaoSeguranca';
import { AvisoNovaVersao } from '@components/AvisoNovaVersao';
import { useVerificarAtualizacao } from '@hooks/useVerificarAtualizacao';
import { PreferencesProvider, usePreferences } from '@context/PreferencesContext';
import { aoMudarLicenca, lerLicenca } from '@utils/licenca';

SplashScreen.preventAutoHideAsync();

/**
 * Com EXPO_PUBLIC_EXIGIR_SERIAL=1 (definido no build), o app só abre depois de ativar um serial.
 * Desligado, só a IA exige serial. Isto é um portão de tela: quem barra de verdade é o servidor.
 */
const EXIGIR_SERIAL = process.env.EXPO_PUBLIC_EXIGIR_SERIAL === '1';

function RootNavigation() {
  const { profile, loading: carregandoPerfil } = useProfile();
  // não mostra nada do app antes de saber se precisa da tela de bloqueio
  const { carregado: segurancaCarregada } = useSeguranca();
  const [temLicenca, setTemLicenca] = useState<boolean | null>(EXIGIR_SERIAL ? null : true);
  const loading = carregandoPerfil || !segurancaCarregada || temLicenca === null;

  useEffect(() => {
    if (!EXIGIR_SERIAL) return;
    lerLicenca().then((l) => setTemLicenca(!!l));
    return aoMudarLicenca(setTemLicenca);
  }, []);
  useVerificarAtualizacao(!loading);
  const { t } = usePreferences();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    SplashScreen.hideAsync();

    // Termos de Serviço são página pública (link da landing e exigência da Hotmart):
    // abrem sem serial e sem passar pelo onboarding.
    const paginaPublica = segments[0] === 'termos';

    if (EXIGIR_SERIAL && !temLicenca) {
      if (segments[0] !== 'ativar' && !paginaPublica) router.replace('/ativar');
      return;
    }

    const emOnboarding = segments[0] === 'onboarding';
    if (!profile.onboardingConcluido && !emOnboarding && !paginaPublica) {
      router.replace('/onboarding');
    }
  }, [loading, temLicenca, profile.onboardingConcluido, segments]);

  if (loading) {
    return null;
  }

  return (
    <>
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
      <Stack.Screen name="ativar" options={{ headerShown: true, title: t('ativar.titulo') }} />
      <Stack.Screen name="planos" options={{ headerShown: true, title: t('planos.titulo') }} />
      <Stack.Screen name="termos" options={{ headerShown: true, title: t('paywall.termosServico') }} />
      <Stack.Screen name="recipe-builder" options={{ headerShown: true, title: t('titulos.receitas') }} />
      <Stack.Screen name="glp1" options={{ headerShown: true, title: t('titulos.glp1') }} />
      <Stack.Screen name="diabetes" options={{ headerShown: true, title: t('titulos.diabetes') }} />
      <Stack.Screen name="peso" options={{ headerShown: true, title: t('titulos.peso') }} />
      <Stack.Screen name="medicacao" options={{ headerShown: true, title: t('med.tituloTela') }} />
      <Stack.Screen name="refeicao" options={{ headerShown: true, title: t('ref.titulo') }} />
      <Stack.Screen name="apetite" options={{ headerShown: true, title: t('titulos.apetite') }} />
    </Stack>
    <AvisoNovaVersao ativo={!loading} />
    {/* Termos de Serviço é página pública: o portão de senha não deve cobrir o documento */}
    {segments[0] !== 'termos' ? <PortaoSeguranca /> : null}
    </>
  );
}

/**
 * Quando o tema muda, a "key" muda e a navegação é remontada —
 * assim todas as telas são redesenhadas com as cores novas.
 */
function NavegacaoComTema() {
  const { tema } = usePreferences();
  return (
    <>
      <StatusBar style={TEMAS_ESCUROS.includes(tema) ? 'light' : 'dark'} />
      <RootNavigation key={tema} />
    </>
  );
}

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <ProfileProvider>
        <SegurancaProvider>
        <RecordsProvider>
          <CustomRecipesProvider>
            <NewsProvider>
              <Glp1Provider>
                <DiabetesProvider>
                  <MedicacoesProvider>
                    <NavegacaoComTema />
                  </MedicacoesProvider>
                </DiabetesProvider>
              </Glp1Provider>
            </NewsProvider>
          </CustomRecipesProvider>
        </RecordsProvider>
        </SegurancaProvider>
      </ProfileProvider>
    </PreferencesProvider>
  );
}
