import { Stack } from 'expo-router';
import { colors } from '@constants/colors';
import { useT } from '@context/PreferencesContext';

export default function FitnessLayout() {
  const t = useT();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('fitness.titulo') }} />
      <Stack.Screen name="historico" options={{ title: t('fitness.historico') }} />
      <Stack.Screen name="treino/[id]" options={{ title: t('fitness.editarTreino') }} />
      <Stack.Screen name="executar/[id]" options={{ title: t('fitness.executarTreino') }} />
    </Stack>
  );
}
