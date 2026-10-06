import { View, Pressable } from 'react-native';
import { Lightbulb, X } from 'lucide-react-native';
import { ThemedText } from '@components/ThemedText';
import { usePreferences } from '@context/PreferencesContext';
import type { ChaveTraducao } from '@/i18n';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

/**
 * Balão de ajuda. Aparece enquanto as Dicas estiverem ligadas (menu ⋮) e a
 * pessoa não tiver fechado esta dica no X.
 */
export function Dica({ id, texto }: { id: string; texto: ChaveTraducao }) {
  const { t, dicaVisivel, ocultarDica } = usePreferences();
  if (!dicaVisivel(id)) return null;
  return (
    <View style={styles.caixa} accessibilityRole="text">
      <Lightbulb size={16} color={colors.primary} strokeWidth={2} style={{ marginTop: 2 }} />
      <ThemedText variant="small" color="text" style={styles.texto}>{t(texto)}</ThemedText>
      <Pressable onPress={() => ocultarDica(id)} hitSlop={10} accessibilityLabel={t('dica.fechar')}>
        <X size={16} color={colors.textSecondary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = estilosTema(() => ({
  caixa: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  texto: { flex: 1, marginHorizontal: spacing.sm },
}));
