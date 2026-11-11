import { Stack } from 'expo-router';
import { colors } from '@constants/colors';
import { usePreferences } from '@context/PreferencesContext';

export default function FitnessLayout() {
  const { t } = usePreferences();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="exercicios" options={{ title: t('abas.exercicios') }} />
      <Stack.Screen name="plano" options={{ title: t('fitness.planoSemanal') }} />
      <Stack.Screen name="rotina/[id]" options={{ title: t('fitness.editarRotina') }} />
      <Stack.Screen name="biblioteca" options={{ title: t('fitness.biblioteca') }} />
      <Stack.Screen name="historico" options={{ title: t('fitness.historico') }} />
      <Stack.Screen name="peso" options={{ title: t('fitness.peso') }} />
      <Stack.Screen name="estatisticas" options={{ title: t('fitness.estatisticas') }} />
      <Stack.Screen name="configuracoes" options={{ title: t('fitness.configuracoes') }} />
      <Stack.Screen name="executar/[id]" options={{ title: t('fitness.executarTreino') }} />
    </Stack>
  );
}
