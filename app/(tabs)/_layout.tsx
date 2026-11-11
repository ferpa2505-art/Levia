import { Pressable, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, BookOpen, TrendingUp, HeartPulse, Plus, Dumbbell } from 'lucide-react-native';
import { colors } from '@constants/colors';
import { MenuOpcoes } from '@components/MenuOpcoes';
import { useT } from '@context/PreferencesContext';

export default function TabsLayout() {
  const t = useT();
  const router = useRouter();
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
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => router.push('/fitness')} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('header.guiaTreinos')}>
                <Dumbbell size={24} color={colors.primary} strokeWidth={2} />
              </Pressable>
              <MenuOpcoes />
            </View>
          ),
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
        name="novo"
        options={{
          title: t('home.adicionar'),
          tabBarLabel: () => null,
          tabBarAccessibilityLabel: t('home.adicionar'),
          tabBarButton: () => (
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Pressable
                onPress={() => router.push('/refeicao')}
                accessibilityRole="button"
                accessibilityLabel={t('home.adicionar')}
                style={{
                  marginTop: -4,
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: colors.text,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Plus size={26} color={colors.surface} strokeWidth={2.5} />
              </Pressable>
            </View>
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
