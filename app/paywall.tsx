import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@context/SubscriptionContext';
import { useT } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';

interface PricingOption {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}

export default function PaywallScreen() {
  const router = useRouter();
  const t = useT();
  const { purchasePackage, isLoading: isLoadingPurchase, isPremium, availablePackages } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string>('annual');
  const [isProcessing, setIsProcessing] = useState(false);

  // Planos de preço (mockados - em produção viriam do RevenueCat)
  const pricingOptions: PricingOption[] = [
    {
      id: 'monthly',
      name: t('paywall.mensal', { defaultValue: 'Mensal' }),
      price: 'R$ 19,90',
      period: t('paywall.porMes', { defaultValue: '/mês' }),
      features: [
        t('paywall.recurso1', { defaultValue: '✓ Rastreamento avançado de glicemia' }),
        t('paywall.recurso2', { defaultValue: '✓ Alertas personalizados' }),
        t('paywall.recurso3', { defaultValue: '✓ Relatórios semanais' }),
        t('paywall.recurso4', { defaultValue: '✓ Sincronização com Alexa' }),
      ],
    },
    {
      id: 'annual',
      name: t('paywall.anual', { defaultValue: 'Anual' }),
      price: 'R$ 155,76',
      originalPrice: 'R$ 238,80',
      period: t('paywall.porAno', { defaultValue: '/ano' }),
      features: [
        t('paywall.recurso1', { defaultValue: '✓ Rastreamento avançado de glicemia' }),
        t('paywall.recurso2', { defaultValue: '✓ Alertas personalizados' }),
        t('paywall.recurso3', { defaultValue: '✓ Relatórios semanais' }),
        t('paywall.recurso4', { defaultValue: '✓ Sincronização com Alexa' }),
        t('paywall.recurso5', { defaultValue: '✓ Suporte prioritário' }),
        t('paywall.recurso6', { defaultValue: '✓ Acesso à IA de nutrição' }),
      ],
      highlighted: true,
    },
  ];

  const handlePurchase = async () => {
    if (isProcessing || isLoadingPurchase) return;

    try {
      setIsProcessing(true);

      // Em produção, usaria availablePackages
      // Por enquanto, simula sucesso de compra
      Alert.alert(
        t('paywall.sucesso', { defaultValue: 'Sucesso!' }),
        t('paywall.compraRealizadaMsg', {
          defaultValue: 'Sua assinatura foi ativada. Obrigado pelo suporte!',
        }),
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      // Descomentar quando RevenueCat estiver configurado:
      // await purchasePackage(selectedPlan);
    } catch (error) {
      Alert.alert(
        t('paywall.erro', { defaultValue: 'Erro' }),
        t('paywall.erroMsg', {
          defaultValue: 'Ocorreu um erro ao processar sua compra. Tente novamente.',
        })
      );
      console.error('Erro ao comprar:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('paywall.titulo', { defaultValue: 'Pacotes Premium' })}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.premiumBanner}>
            <Ionicons name="checkmark-circle" size={60} color={colors.primary} />
            <Text style={styles.premiumTitle}>
              {t('paywall.jaPremium', { defaultValue: 'Você já é Premium!' })}
            </Text>
            <Text style={styles.premiumDesc}>
              {t('paywall.obrigado', {
                defaultValue: 'Obrigado pelo suporte. Aproveite todos os recursos exclusivos.',
              })}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('paywall.titulo', { defaultValue: 'Pacotes Premium' })}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            {t('paywall.desbloqueieRecursos', { defaultValue: 'Desbloqueie recursos exclusivos' })}
          </Text>
          <Text style={styles.introDesc}>
            {t('paywall.pagarUnicaVez', {
              defaultValue: 'Pague uma única vez e tenha acesso ilimitado.',
            })}
          </Text>
        </View>

        {/* Tabs de seleção */}
        <View style={styles.tabs}>
          {pricingOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.tab, selectedPlan === option.id && styles.tabActive]}
              onPress={() => setSelectedPlan(option.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedPlan === option.id && styles.tabTextActive,
                ]}
              >
                {option.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cards de preço */}
        <View style={styles.cardsContainer}>
          {pricingOptions.map((option) => (
            <View
              key={option.id}
              style={[
                styles.priceCard,
                selectedPlan === option.id && styles.priceCardSelected,
                option.highlighted && selectedPlan !== option.id && styles.priceCardHighlighted,
              ]}
            >
              {option.highlighted && selectedPlan !== option.id && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {t('paywall.melhorPreço', { defaultValue: '💰 MELHOR PREÇO' })}
                  </Text>
                </View>
              )}

              <View style={styles.priceSection}>
                <Text style={styles.priceValue}>{option.price}</Text>
                {option.originalPrice && (
                  <Text style={styles.originalPrice}>{option.originalPrice}</Text>
                )}
                <Text style={styles.pricePeriod}>{option.period}</Text>
                {option.originalPrice && (
                  <Text style={styles.discount}>
                    {t('paywall.desconto', { defaultValue: '20% OFF' })}
                  </Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.featuresContainer}>
                {option.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Botão de compra */}
        <TouchableOpacity
          style={[
            styles.buyButton,
            (isProcessing || isLoadingPurchase) && styles.buyButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={isProcessing || isLoadingPurchase}
        >
          {isProcessing || isLoadingPurchase ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="card" size={20} color="white" />
              <Text style={styles.buyButtonText}>
                {selectedPlan === 'annual'
                  ? t('paywall.comprarAnual', { defaultValue: 'Assinar por R$ 155,76/ano' })
                  : t('paywall.comprarMensal', { defaultValue: 'Assinar por R$ 19,90/mês' })}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info de teste */}
        <View style={styles.testingInfo}>
          <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
          <Text style={styles.testingText}>
            {t('paywall.testeGratis', {
              defaultValue: '7 dias grátis. Cancele a qualquer momento.',
            })}
          </Text>
        </View>

        {/* Links */}
        <View style={styles.links}>
          <TouchableOpacity>
            <Text style={styles.link}>
              {t('paywall.politicaPrivacidade', { defaultValue: 'Política de Privacidade' })}
            </Text>
          </TouchableOpacity>
          <Text style={styles.linkSeparator}>•</Text>
          <TouchableOpacity>
            <Text style={styles.link}>
              {t('paywall.termosServico', { defaultValue: 'Termos de Serviço' })}
            </Text>
          </TouchableOpacity>
          <Text style={styles.linkSeparator}>•</Text>
          <TouchableOpacity>
            <Text style={styles.link}>
              {t('paywall.restaurarCompras', { defaultValue: 'Restaurar Compras' })}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  intro: {
    marginBottom: spacing['2xl'],
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  introDesc: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    backgroundColor: '#F0F0F0',
    borderRadius: radius.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: 'white',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabTextActive: {
    color: colors.primary,
  },
  cardsContainer: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  priceCard: {
    backgroundColor: 'white',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  priceCardSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  priceCardHighlighted: {
    borderColor: '#FFC107',
    backgroundColor: '#FFFEF5',
  },
  badge: {
    backgroundColor: '#FFC107',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: spacing.xs,
  },
  pricePeriod: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  discount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B6B',
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: spacing.md,
  },
  featuresContainer: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  buyButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testingInfo: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  testingText: {
    flex: 1,
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  link: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  linkSeparator: {
    color: colors.textSecondary,
  },
  premiumBanner: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  premiumDesc: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
