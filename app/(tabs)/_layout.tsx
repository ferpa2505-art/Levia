import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, BookOpen, TrendingUp, HeartPulse, Dumbbell } from 'lucide-react-native';
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
        name="treinos"
        options={{
          title: t('fitness.titulo'),
          tabBarLabel: t('fitness.abaTreinos'),
          tabBarIcon: ({ color, focused, size }) => (
            <Dumbbell size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="evolucao"
        options={{
          title: t('abas.evolucao'),
          tabBarLabel: t('abas.evolucao'),
          tabBarIcon: ({ color, focused, size }) => (
            <TrendingUp size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* Notícias fica guardada para uma próxima atualização: a tela continua no código, só sai da barra */}
      <Tabs.Screen name="news" options={{ href: null }} />
      <Tabs.Screen
        name="saude"
        options={{
          title: t('abas.saude'),
          tabBarLabel: t('abas.saude'),
          tabBarIcon: ({ color, focused, size }) => (
            <HeartPulse size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
