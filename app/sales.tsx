import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '@context/PreferencesContext';
import { ThemedText } from '@components/ThemedText';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const HOTMART_CHECKOUT_URL = 'https://pay.hotmart.com'; // URL base do Hotmart

// IDs dos produtos no Hotmart - CONFIGURAR COM OS IDs REAIS
const HOTMART_PRODUCT_IDS = {
  monthly: 'SEU_PRODUCT_ID_MONTHLY',
  semiannual: 'SEU_PRODUCT_ID_SEMIANNUAL',
  annual: 'SEU_PRODUCT_ID_ANNUAL',
};

export default function SalesScreen() {
  const t = useT();

  const openCheckout = (planKey: 'monthly' | 'semiannual' | 'annual') => {
    const productId = HOTMART_PRODUCT_IDS[planKey];
    if (productId && productId !== `SEU_PRODUCT_ID_${planKey.toUpperCase()}`) {
      Linking.openURL(`${HOTMART_CHECKOUT_URL}/${productId}`);
    } else {
      alert(`Configure o Product ID do plano ${planKey} no Hotmart`);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../src/assets/images/levia-simbolo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText variant="heading" style={styles.title}>
              {t('vendas.titulo')}
            </ThemedText>
            <ThemedText variant="small" style={styles.subtitle}>
              {t('vendas.subtitulo')}
            </ThemedText>
          </View>

          {/* Plan Cards */}
          <View style={styles.plansContainer}>
            {/* Monthly Plan */}
            <View style={[styles.planCard, styles.planMonthly]}>
              <View style={styles.planHeader}>
                <ThemedText variant="subheading" style={styles.planName}>
                  {t('vendas.planos.mensal.nome')}
                </ThemedText>
                <ThemedText variant="small" style={styles.planPeriod}>
                  {t('vendas.planos.mensal.periodo')}
                </ThemedText>
              </View>
              <ThemedText variant="heading" style={styles.planPrice}>
                {t('vendas.planos.mensal.preco')}
              </ThemedText>
              <View style={styles.features}>
                <ThemedText style={styles.feature}>{t('vendas.planos.mensal.fotos')}</ThemedText>
                <ThemedText style={styles.feature}>{t('vendas.planos.mensal.acesso')}</ThemedText>
                <ThemedText style={styles.feature}>{t('vendas.planos.mensal.cancelar')}</ThemedText>
              </View>
              <Pressable
                style={({ pressed }) => [styles.cta, styles.ctaMonthly, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => openCheckout('monthly')}
              >
                <ThemedText variant="subheading" style={styles.ctaText}>
                  {t('vendas.planos.mensal.botao')}
                </ThemedText>
              </Pressable>
            </View>

            {/* Semiannual Plan - DESTAQUE */}
            <View style={[styles.planCard, styles.planSemiannual, styles.planHighlight]}>
              <View style={styles.badge}>
                <ThemedText variant="small" style={styles.badgeText}>
                  {t('vendas.planos.semestral.destaque')}
                </ThemedText>
              </View>
              <View style={styles.planHeader}>
                <ThemedText variant="subheading" style={styles.planName}>
                  {t('vendas.planos.semestral.nome')}
                </ThemedText>
                <ThemedText variant="small" style={styles.planPeriod}>
                  {t('vendas.planos.semestral.periodo')}
                </ThemedText>
              </View>
              <ThemedText variant="heading" style={styles.planPrice}>
                {t('vendas.planos.semestral.preco')}
              </ThemedText>
              <ThemedText variant="small" style={styles.planSavings}>
                {t('vendas.planos.semestral.economia')}
              </ThemedText>
              <View style={styles.features}>
                <ThemedText style={styles.feature}>{t('vendas.planos.semestral.fotos')}</ThemedText>
                <ThemedText style={styles.feature}>{t('vendas.planos.semestral.acesso')}</ThemedText>
                <ThemedText style={styles.feature}>{t('vendas.planos.semestral.cancelar')}</ThemedText>
              </View>
              <Pressable
                style={({ pressed }) => [styles.cta, styles.ctaSemiannual, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => openCheckout('semiannual')}
              >
                <ThemedText variant="subheading" style={styles.ctaText}>
                  {t('vendas.planos.semestral.botao')}
                </ThemedText>
              </Pressable>
            </View>

            {/* Annual Plan */}
            <View style={[styles.planCard, styles.planAnnual]}>
              <View style={styles.planHeader}>
                <ThemedText variant="subheading" style={styles.planName}>
                  {t('vendas.planos.anual.nome')}
                </ThemedText>
                <ThemedText variant="small" style={styles.planPeriod}>
                  {t('vendas.planos.anual.periodo')}
                </ThemedText>
              </View>
              <ThemedText variant="heading" style={styles.planPrice}>
                {t('vendas.planos.anual.preco')}
              </ThemedText>
              <ThemedText variant="small" style={styles.planSavings}>
                {t('vendas.planos.anual.economia')}
              </ThemedText>
              <View style={styles.features}>
                <ThemedText style={styles.feature}>{t('vendas.planos.anual.fotos')}</ThemedText>
                <ThemedText style={styles.feature}>{t('vendas.planos.anual.acesso')}</ThemedText>
                <ThemedText style={styles.feature}>{t('vendas.planos.anual.cancelar')}</ThemedText>
              </View>
              <Pressable
                style={({ pressed }) => [styles.cta, styles.ctaAnnual, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => openCheckout('annual')}
              >
                <ThemedText variant="subheading" style={styles.ctaText}>
                  {t('vendas.planos.anual.botao')}
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Trust / Security */}
          <View style={styles.trustSection}>
            <ThemedText variant="small" style={styles.trustTitle}>
              {t('vendas.seguranca.titulo')}
            </ThemedText>
            <View style={styles.trustItems}>
              <View style={styles.trustItem}>
                <ThemedText style={styles.trustIcon}>🔒</ThemedText>
                <ThemedText style={styles.trustText}>{t('vendas.seguranca.pagamento')}</ThemedText>
              </View>
              <View style={styles.trustItem}>
                <ThemedText style={styles.trustIcon}>📱</ThemedText>
                <ThemedText style={styles.trustText}>{t('vendas.seguranca.entrega')}</ThemedText>
              </View>
              <View style={styles.trustItem}>
                <ThemedText style={styles.trustIcon}>✅</ThemedText>
                <ThemedText style={styles.trustText}>{t('vendas.seguranca.garantia')}</ThemedText>
              </View>
            </View>
          </View>

          {/* CTA for existing license */}
          <View style={styles.existingLicense}>
            <ThemedText variant="small" style={styles.existingText}>
              {t('vendas.jaTemLicenca')}
            </ThemedText>
            <Pressable
              style={({ pressed }) => [styles.ctaOutline, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => {
                // Navegar para tela de validação de licença
              }}
            >
              <ThemedText variant="subheading" style={styles.ctaOutlineText}>
                {t('vendas.validarLicenca')}
              </ThemedText>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText variant="small" style={styles.footerText}>
              {t('vendas.footer')}
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = estilosTema(() => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  plansContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  planCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: colors.cardBackground,
  },
  planHighlight: {
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
  },
  planMonthly: {
    borderTopWidth: 4,
    borderTopColor: colors.info,
  },
  planSemiannual: {
    borderTopWidth: 4,
    borderTopColor: colors.warning,
  },
  planAnnual: {
    borderTopWidth: 4,
    borderTopColor: colors.success,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  badgeText: {
    color: '#000',
    fontWeight: 'bold',
  },
  planHeader: {
    marginBottom: spacing.md,
  },
  planName: {
    textAlign: 'center',
  },
  planPeriod: {
    textAlign: 'center',
    opacity: 0.7,
  },
  planPrice: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  planSavings: {
    textAlign: 'center',
    color: colors.success,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  features: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  feature: {
    fontSize: 14,
    opacity: 0.85,
  },
  cta: {
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFF',
    fontWeight: '600',
  },
  ctaMonthly: {
    backgroundColor: colors.info,
  },
  ctaSemiannual: {
    backgroundColor: colors.warning,
  },
  ctaAnnual: {
    backgroundColor: colors.success,
  },
  trustSection: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  trustTitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  trustItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  trustText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.8,
  },
  existingLicense: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  existingText: {
    textAlign: 'center',
    marginBottom: spacing.md,
    opacity: 0.7,
  },
  ctaOutline: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
  },
  ctaOutlineText: {
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.5,
    fontSize: 11,
  },
}));