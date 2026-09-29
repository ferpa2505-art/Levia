import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Flame, Beef, Droplet, Zap, Feather, Target, Syringe, ChevronRight } from 'lucide-react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { LeviaPena } from '@components/LeviaPena';
import { useProfile } from '@context/ProfileContext';
import { useRecords } from '@context/RecordsContext';
import { colors, spacing, radius } from '@constants/colors';
import { useT } from '@context/PreferencesContext';
import { estilosTema } from '@theme/estilos';

export default function HomeScreen() {
  const router = useRouter();
  const t = useT();
  const { profile } = useProfile();
  const { kcalHoje, proteinaHojeG, aguaHojeMl, pesoAtualKg, adicionarPeso, kcalGastaHoje } = useRecords();
  const nome = profile.comoChamar || profile.nome || '';

  const [editandoPeso, setEditandoPeso] = useState(false);
  const [pesoTexto, setPesoTexto] = useState('');

  const pesoAtual = pesoAtualKg ?? profile.pesoAtualKg;
  const temPesoEMeta = pesoAtual != null && profile.metaPesoKg != null;
  const diferenca = temPesoEMeta
    ? Math.round(Math.abs(pesoAtual! - profile.metaPesoKg!) * 10) / 10
    : null;
  const jaNaMeta = diferenca !== null && diferenca === 0;

  async function handleSalvarPeso() {
    const novoPeso = parseFloat(pesoTexto.replace(',', '.'));
    if (!isNaN(novoPeso) && novoPeso > 0) {
      await adicionarPeso(novoPeso);
    }
    setEditandoPeso(false);
    setPesoTexto('');
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <ThemedView style={styles.container}>
        <View style={styles.greeting}>
          <View style={styles.greetingRow}>
            <LeviaPena size={44} />
            <ThemedText variant="title" color="primary" style={styles.greetingTitle}>
              {nome ? t('home.ola', { nome }) : t('home.olaSemNome')}
            </ThemedText>
          </View>
          <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            {t('home.subtitulo')}
          </ThemedText>
        </View>

        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text">{t('home.resumo')}</ThemedText>
          <View style={styles.statsGrid}>
            <View style={[styles.statChip, { backgroundColor: colors.primarySoft }]}>
              <Flame size={20} color={colors.primary} strokeWidth={2.25} style={styles.statIcone} />
              <ThemedText variant="heading" color="primary">{kcalHoje}</ThemedText>
              <ThemedText variant="small" color="textSecondary">{t('home.kcal')}</ThemedText>
            </View>
            <View style={[styles.statChip, { backgroundColor: colors.secondarySoft }]}>
              <Beef size={20} color={colors.secondary} strokeWidth={2.25} style={styles.statIcone} />
              <ThemedText variant="heading" color="secondary">{proteinaHojeG}</ThemedText>
              <ThemedText variant="small" color="textSecondary">{t('home.proteina')}</ThemedText>
            </View>
            <View style={[styles.statChip, { backgroundColor: colors.accentSoft }]}>
              <Droplet size={20} color={colors.accent} strokeWidth={2.25} style={styles.statIcone} />
              <ThemedText variant="heading" color="accent">{aguaHojeMl}</ThemedText>
              <ThemedText variant="small" color="textSecondary">{t('home.agua')}</ThemedText>
            </View>
            <View style={[styles.statChip, { backgroundColor: colors.secondarySoft }]}>
              <Zap size={20} color={colors.secondary} strokeWidth={2.25} style={styles.statIcone} />
              <ThemedText variant="heading" color="secondary">{kcalGastaHoje}</ThemedText>
              <ThemedText variant="small" color="textSecondary">{t('home.kcalGastas')}</ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.pesoHeader}>
            <View style={styles.pesoTituloRow}>
              <Feather size={18} color={colors.primary} strokeWidth={2} />
              <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
                {t('home.seuPeso')}
              </ThemedText>
            </View>
            {!editandoPeso && (
              <Button
                label={t('comum.atualizar')}
                variant="outline"
                size="sm"
                onPress={() => {
                  setPesoTexto(pesoAtual != null ? String(pesoAtual) : '');
                  setEditandoPeso(true);
                }}
              />
            )}
          </View>

          {editandoPeso ? (
            <View style={styles.editRow}>
              <Input
                value={pesoTexto}
                onChangeText={setPesoTexto}
                keyboardType="decimal-pad"
                placeholder="0"
                autoFocus
                style={styles.pesoInput}
              />
              <ThemedText variant="body" color="textSecondary" style={{ marginLeft: spacing.sm }}>kg</ThemedText>
              <View style={styles.editButtons}>
                <Button label={t('comum.cancelar')} variant="outline" size="sm" onPress={() => setEditandoPeso(false)} style={{ marginRight: spacing.sm }} />
                <Button label={t('comum.salvar')} variant="primary" size="sm" onPress={handleSalvarPeso} />
              </View>
            </View>
          ) : (
            <>
              <ThemedText variant="title" color="primary" style={{ marginVertical: spacing.md }}>
                {pesoAtual != null ? `${pesoAtual} kg` : '-- kg'}
              </ThemedText>
              {temPesoEMeta ? (
                <View style={styles.metaRow}>
                  {!jaNaMeta && <Target size={14} color={colors.textSecondary} strokeWidth={2} />}
                  <ThemedText
                    variant="small"
                    color="textSecondary"
                    style={!jaNaMeta ? { marginLeft: spacing.xs } : undefined}
                  >
                    {jaNaMeta
                      ? t('home.naMeta')
                      : t('home.meta', { meta: profile.metaPesoKg!, falta: diferenca! })}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText variant="small" color="textSecondary">{t('home.ultimaPesagem')}</ThemedText>
              )}
            </>
          )}
        </ThemedView>

        <Pressable onPress={() => router.push('/glp1')}>
          <ThemedView variant="surface" style={[styles.card, styles.cardShadow, styles.glp1Card]}>
            <View style={styles.glp1IconCircle}>
              <Syringe size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <ThemedText variant="subheading" color="text">{t('titulos.glp1')}</ThemedText>
              <ThemedText variant="small" color="textSecondary">
                {t('home.glp1Desc')}
              </ThemedText>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </ThemedView>
        </Pressable>

        <Pressable onPress={() => router.push('/diabetes')}>
          <ThemedView variant="surface" style={[styles.card, styles.cardShadow, styles.glp1Card]}>
            <View style={[styles.glp1IconCircle, { backgroundColor: colors.primarySoft }]}>
              <Droplet size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <ThemedText variant="subheading" color="text">{t('titulos.diabetes', { defaultValue: 'Diabetes' })}</ThemedText>
              <ThemedText variant="small" color="textSecondary">
                {t('home.diabetesDesc', { defaultValue: 'Rastreie glicemia e medicações' })}
              </ThemedText>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </ThemedView>
        </Pressable>

        <Pressable onPress={() => router.push('/camera')}>
          <ThemedView variant="surface" style={[styles.card, styles.cardShadow, styles.glp1Card]}>
            <View style={[styles.glp1IconCircle, { backgroundColor: '#FF6B6B20' }]}>
              <Flame size={20} color="#FF6B6B" strokeWidth={2} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <ThemedText variant="subheading" color="text">{t('home.reconhecerComida', { defaultValue: '📷 Reconhecer Alimento' })}</ThemedText>
              <ThemedText variant="small" color="textSecondary">
                {t('home.reconhecerComidaDesc', { defaultValue: 'Use câmera para adicionar refeição' })}
              </ThemedText>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </ThemedView>
        </Pressable>

        <View style={styles.status}>
          <ThemedText variant="caption" color="textSecondary">v0.1.0 • {t('home.versao')}</ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = estilosTema(() => ({
  container: { flex: 1 },
  greeting: { marginBottom: spacing['2xl'] },
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  greetingTitle: { marginLeft: spacing.sm },
  card: { padding: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.xl },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  statChip: {
    flexBasis: '48%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs / 2,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
  },
  statIcone: { marginBottom: 4 },
  pesoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pesoTituloRow: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  editRow: { marginTop: spacing.md },
  pesoInput: { textAlign: 'left' },
  editButtons: { flexDirection: 'row', marginTop: spacing.md },
  status: { marginTop: spacing['2xl'], alignItems: 'center' },
  glp1Card: { flexDirection: 'row', alignItems: 'center' },
  glp1IconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
