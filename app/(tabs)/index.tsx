import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Flame, Beef, Droplet, Zap, Feather, Target, Syringe, ChevronRight, TrendingDown, Wheat, Nut, Leaf } from 'lucide-react-native';
import { GraficoPesoTendencia } from '@components/GraficoPesoTendencia';
import { Dica } from '@components/Dica';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { LeviaPena } from '@components/LeviaPena';
import { CartaoGlicemia } from '@components/diabetes/CartaoGlicemia';
import { useProfile } from '@context/ProfileContext';
import { useRecords } from '@context/RecordsContext';
import { useDiabetes } from '@context/DiabetesContext';
import { colors, spacing, radius } from '@constants/colors';
import { useT } from '@context/PreferencesContext';
import { MensagemErro } from '@components/forms/MensagemErro';
import { estilosTema } from '@theme/estilos';

export default function HomeScreen() {
  const router = useRouter();
  const t = useT();
  const { profile } = useProfile();
  const {
    kcalHoje, proteinaHojeG, carboidratoHojeG, gorduraHojeG, fibraHojeG,
    aguaHojeMl, pesoAtualKg, pesos, adicionarPeso, kcalGastaHoje,
  } = useRecords();
  const nome = profile.comoChamar || profile.nome || '';
  const temGlicemias = useDiabetes().glicemias.length > 0;

  const [editandoPeso, setEditandoPeso] = useState(false);
  const [pesoTexto, setPesoTexto] = useState('');

  const pesoAtual = pesoAtualKg ?? profile.pesoAtualKg;
  const temPesoEMeta = pesoAtual != null && profile.metaPesoKg != null;
  const diferenca = temPesoEMeta
    ? Math.round(Math.abs(pesoAtual! - profile.metaPesoKg!) * 10) / 10
    : null;
  const jaNaMeta = diferenca !== null && diferenca === 0;

  const erroPeso = pesoTexto.trim() && !(parseFloat(pesoTexto.replace(',', '.')) >= 20 && parseFloat(pesoTexto.replace(',', '.')) <= 400) ? t('form.erroPeso') : null;

  async function handleSalvarPeso() {
    const novoPeso = parseFloat(pesoTexto.replace(',', '.'));
    if (!isNaN(novoPeso) && novoPeso > 0) {
      await adicionarPeso(novoPeso);
    }
    setEditandoPeso(false);
    setPesoTexto('');
  }

  return (
    <TelaRolavel>
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

        <Dica id="home.inicio" texto="dica.home" />

        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text">{t('home.resumo')}</ThemedText>
          {/* kcal em destaque; os 4 nutrientes numa linha; água e gasto embaixo */}
          <View style={[styles.statKcal, { backgroundColor: colors.primarySoft }]}>
            <Flame size={22} color={colors.primary} strokeWidth={2.25} />
            <ThemedText variant="title" color="primary" style={{ marginLeft: spacing.sm }}>{kcalHoje}</ThemedText>
            <ThemedText variant="small" color="textSecondary" style={{ marginLeft: spacing.xs }}>{t('home.kcal')}</ThemedText>
          </View>
          <View style={styles.statsGrid}>
            <Stat icone={<Beef size={18} color={colors.secondary} strokeWidth={2.25} />} valor={proteinaHojeG} rotulo={t('home.proteina')} cor="secondary" fundo={colors.secondarySoft} />
            <Stat icone={<Wheat size={18} color={colors.accent} strokeWidth={2.25} />} valor={carboidratoHojeG} rotulo={t('home.carbo')} cor="accent" fundo={colors.accentSoft} />
            <Stat icone={<Nut size={18} color={colors.secondary} strokeWidth={2.25} />} valor={gorduraHojeG} rotulo={t('home.gordura')} cor="secondary" fundo={colors.secondarySoft} />
            <Stat icone={<Leaf size={18} color={colors.primary} strokeWidth={2.25} />} valor={fibraHojeG} rotulo={t('home.fibra')} cor="primary" fundo={colors.primarySoft} />
          </View>
          <View style={styles.statsGrid}>
            <Stat largo icone={<Droplet size={18} color={colors.accent} strokeWidth={2.25} />} valor={aguaHojeMl} rotulo={t('home.agua')} cor="accent" fundo={colors.accentSoft} />
            <Stat largo icone={<Zap size={18} color={colors.secondary} strokeWidth={2.25} />} valor={kcalGastaHoje} rotulo={t('home.kcalGastas')} cor="secondary" fundo={colors.secondarySoft} />
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
                style={[styles.pesoInput, erroPeso && { borderColor: colors.error }]}
              />
              <ThemedText variant="body" color="textSecondary" style={{ marginLeft: spacing.sm }}>kg</ThemedText>
              <View style={styles.editButtons}>
                <Button label={t('comum.cancelar')} variant="outline" size="sm" onPress={() => setEditandoPeso(false)} style={{ marginRight: spacing.sm }} />
                <Button label={t('comum.salvar')} variant="primary" size="sm" onPress={handleSalvarPeso} disabled={!!erroPeso} />
              </View>
            </View>
          ) : null}
          {editandoPeso ? (
            <MensagemErro texto={erroPeso} />
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
              <GraficoPesoTendencia pesos={pesos} meta={profile.metaPesoKg} pesoInicialPerfil={profile.pesoAtualKg} />
              <Pressable onPress={() => router.push('/peso')} style={styles.verEvolucao} hitSlop={8}>
                <TrendingDown size={14} color={colors.primary} strokeWidth={2} />
                <ThemedText variant="small" color="primary" style={{ marginLeft: spacing.xs }}>
                  {t('home.verEvolucao')}
                </ThemedText>
                <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
              </Pressable>
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

        {(profile.tipoDiabetes !== 'nenhum' || temGlicemias) && (
          <CartaoGlicemia onAbrir={() => router.push('/diabetes')} />
        )}

        <View style={styles.status}>
          <ThemedText variant="caption" color="textSecondary">Leviã v{Constants.expoConfig?.version ?? ''}</ThemedText>
        </View>
      </ThemedView>
    </TelaRolavel>
  );
}

function Stat({
  icone, valor, rotulo, cor, fundo, largo,
}: {
  icone: React.ReactNode;
  valor: number;
  rotulo: string;
  cor: 'primary' | 'secondary' | 'accent';
  fundo: string;
  largo?: boolean;
}) {
  return (
    <View style={[styles.statChip, largo && styles.statLargo, { backgroundColor: fundo }]}>
      {icone}
      <ThemedText variant="subheading" color={cor} style={{ marginTop: 2 }}>{valor}</ThemedText>
      <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>{rotulo}</ThemedText>
    </View>
  );
}

const styles = estilosTema(() => ({
  verEvolucao: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
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
  statKcal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
  },
  statsGrid: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.xs },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: radius.lg,
  },
  statLargo: { flexDirection: 'column' },
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
