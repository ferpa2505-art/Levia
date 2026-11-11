import { Linking, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { useT } from '@context/PreferencesContext';
import { colors, radius, spacing } from '@constants/colors';
import { linkDoPlano, PlanoPago, PRECO_ANUAL, PRECO_MENSAL } from '@constants/planos';
import { estilosTema } from '@theme/estilos';

/**
 * Escolha do plano: mensal ou anual. O botão abre o pagamento seguro da Hotmart
 * (o cadastro e a cobrança acontecem lá, nada de cartão passa pelo app).
 */
export default function Planos() {
  const t = useT();
  const router = useRouter();
  const abrir = (plano: PlanoPago) => { Linking.openURL(linkDoPlano(plano)).catch(() => {}); };

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <ThemedText variant="body" color="textSecondary" style={{ marginBottom: spacing.lg }}>
          {t('planos.intro')}
        </ThemedText>

        <View style={styles.cartao}>
          <ThemedText variant="subheading" color="text">{t('planos.mensal')}</ThemedText>
          <ThemedText variant="title" color="primary" style={{ marginTop: spacing.xs }}>
            {PRECO_MENSAL}<ThemedText variant="small" color="textSecondary"> {t('planos.porMes')}</ThemedText>
          </ThemedText>
          <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>{t('planos.mensalDetalhe')}</ThemedText>
          <Button label={t('planos.assinarMensal')} onPress={() => abrir('mensal')} style={{ marginTop: spacing.md }} />
        </View>

        <View style={[styles.cartao, styles.destaque]}>
          <View style={styles.selo}>
            <ThemedText variant="caption" color="primary">{t('planos.economia')}</ThemedText>
          </View>
          <ThemedText variant="subheading" color="text" style={{ marginTop: spacing.sm }}>{t('planos.anual')}</ThemedText>
          <ThemedText variant="title" color="primary" style={{ marginTop: spacing.xs }}>
            {PRECO_ANUAL}<ThemedText variant="small" color="textSecondary"> {t('planos.porAno')}</ThemedText>
          </ThemedText>
          <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>{t('planos.anualDetalhe')}</ThemedText>
          <Button label={t('planos.assinarAnual')} onPress={() => abrir('anual')} style={{ marginTop: spacing.md }} />
        </View>

        <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>{t('planos.nota')}</ThemedText>
        <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>{t('planos.moeda')}</ThemedText>

        <Pressable onPress={() => router.push('/termos')} accessibilityRole="link" hitSlop={8} style={{ marginTop: spacing.md }}>
          <ThemedText variant="small" color="primary" style={styles.link}>{t('paywall.termosServico')}</ThemedText>
        </Pressable>

        <Pressable onPress={() => Linking.openURL('https://www.leviapp.org/#planos').catch(() => {})} accessibilityRole="link" hitSlop={8} style={{ marginTop: spacing.lg }}>
          <ThemedText variant="small" color="primary" style={styles.link}>{t('planos.maisDetalhes')}</ThemedText>
        </Pressable>
      </ThemedView>
    </TelaRolavel>
  );
}

const styles = estilosTema(() => ({
  container: { flex: 1, paddingTop: spacing.md, paddingBottom: spacing.xl },
  cartao: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  destaque: { borderColor: colors.primary, borderWidth: 2 },
  selo: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  link: { textDecorationLine: 'underline' },
}));
