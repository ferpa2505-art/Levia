import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, BookOpen, Dumbbell, Newspaper, User, Droplet } from 'lucide-react-native';
import { colors } from '@constants/colors';
import { MenuOpcoes } from '@components/MenuOpcoes';
import { useT } from '@context/PreferencesContext';

export default function TabsLayout() {
  const t = useT();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          // 76 dp de barra (antes 62) + espaço da barra de navegação do Android
          height: 76 + insets.bottom,
          paddingBottom: 12 + insets.bottom,
          paddingTop: 10,
        },
        tabBarIconStyle: { marginBottom: 2 },
        tabBarLabelStyle: {
          fontSize: 12.5,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerRight: () => <MenuOpcoes />,
        headerTitleStyle: {
          fontWeight: '700',
          color: colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('abas.inicio'),
          tabBarLabel: t('abas.inicio'),
          tabBarIcon: ({ color, focused, size }) => (
            <Home size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t('abas.diario'),
          tabBarLabel: t('abas.diario'),
          tabBarIcon: ({ color, focused, size }) => (
            <BookOpen size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="diabetes"
        options={{
          title: t('abas.diabetes') || 'Diabetes',
          tabBarLabel: t('abas.diabetes') || 'Diabetes',
          tabBarIcon: ({ color, focused, size }) => (
            <Droplet size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: t('abas.exercicios'),
          tabBarLabel: t('abas.exercicios'),
          tabBarIcon: ({ color, focused, size }) => (
            <Dumbbell size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: t('abas.noticias'),
          tabBarLabel: t('abas.noticias'),
          tabBarIcon: ({ color, focused, size }) => (
            <Newspaper size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('abas.perfil'),
          tabBarLabel: t('abas.perfil'),
          tabBarIcon: ({ color, focused, size }) => (
            <User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
