import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Beef, Droplet, Zap, Feather, Target, ChevronRight, TrendingDown, Wheat, Nut, Leaf } from 'lucide-react-native';
import { GraficoPesoTendencia } from '@components/GraficoPesoTendencia';
import { Dica } from '@components/Dica';
import { FaixaTeste } from '@components/FaixaTeste';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { LeviaPena } from '@components/LeviaPena';
import { AnelKcal } from '@components/AnelKcal';
import { BarrasKcal } from '@components/GraficoEvolucao';
import { useProfile } from '@context/ProfileContext';
import { useRecords } from '@context/RecordsContext';

import { colors, spacing, radius } from '@constants/colors';
import { useT } from '@context/PreferencesContext';
import { calcularEvolucao } from '@utils/evolucao';
import { diasSeguidos, partesDosMacros } from '@utils/constancia';
import { dataDeHoje } from '@utils/recordsStorage';
import { useFitness } from '@context/FitnessContext';
import { kcalDaSessao } from '@utils/fitnessLogica';
import { salvarPerfil } from '@utils/profileStorage';
import { MensagemErro } from '@components/forms/MensagemErro';
import { estilosTema } from '@theme/estilos';

export default function HomeScreen() {
  const router = useRouter();
  const t = useT();
  const { profile, updateProfile } = useProfile();
  const {
    kcalHoje, proteinaHojeG, carboidratoHojeG, gorduraHojeG, fibraHojeG,
    aguaHojeMl, pesoAtualKg, pesos, adicionarPeso, kcalGastaHoje, refeicoes,
  } = useRecords();
  const nome = profile.comoChamar || profile.nome || '';

  const hoje = dataDeHoje();
  // gasto de hoje = exercícios registrados + treinos do Guia (estimativa MET); o saldo desconta do que foi ingerido
  const { sessoes: sessoesGuia } = useFitness();
  const gastoGuiaHoje = sessoesGuia.filter((s) => s.data === hoje).reduce((soma, s) => soma + kcalDaSessao(s, profile.pesoAtualKg ?? 70), 0);
  const gastoHoje = kcalGastaHoje + gastoGuiaHoje;
  const saldoHoje = kcalHoje - gastoHoje;
  const sequencia = useMemo(() => diasSeguidos(refeicoes.map((r) => r.data), hoje), [refeicoes, hoje]);
  const semana = useMemo(
    () => calcularEvolucao(
      { refeicoes, aguas: [], pesos: [], exercicios: [], glicemias: [], dosesGlp1: [], medicacoes: [], alvoGlicemia: { min: 70, max: 180 } },
      'semana',
      hoje,
    ),
    [refeicoes, hoje],
  );
  const partes = partesDosMacros(proteinaHojeG, carboidratoHojeG, gorduraHojeG);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaTexto, setMetaTexto] = useState('');
  const metaNumero = parseInt(metaTexto.replace(/\D/g, ''), 10);
  const erroMeta = metaTexto.trim() && !(metaNumero >= 800 && metaNumero <= 6000) ? t('home.erroMeta') : null;

  async function handleSalvarMeta() {
    if (!(metaNumero >= 800 && metaNumero <= 6000)) return;
    updateProfile({ metaKcalDia: metaNumero });
    await salvarPerfil({ ...profile, metaKcalDia: metaNumero });
    setEditandoMeta(false);
    setMetaTexto('');
  }

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

        <FaixaTeste />

        <Dica id="home.inicio" texto="dica.home" />

        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="caption" color="textSecondary" style={styles.sobretitulo}>{t('home.seuDiaAteAqui')}</ThemedText>
          <View style={styles.anelLinha}>
            <AnelKcal kcal={saldoHoje} meta={profile.metaKcalDia} />
            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              <ThemedText variant="subheading" color="text">{t('home.cadaEscolha')}</ThemedText>
              <ThemedText variant="small" color="textSecondary">{t('home.noSeuRitmo')}</ThemedText>
              <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>
                {profile.metaKcalDia ? t('home.deMeta', { meta: profile.metaKcalDia }) : t('home.semMeta')}
              </ThemedText>
              <ThemedText variant="small" color="textSecondary">
                {t('home.saldoDetalhe', { ingeridas: kcalHoje, gastas: gastoHoje })}
              </ThemedText>
              {sequencia > 0 && (
                <View style={[styles.chipCuidado, { backgroundColor: colors.primarySoft }]}>
                  <ThemedText variant="caption" color="primary">
                    ✧ {t(sequencia === 1 ? 'home.diaDeCuidado' : 'home.diasDeCuidado', { n: sequencia })}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {editandoMeta ? (
            <View style={{ marginTop: spacing.md }}>
              <ThemedText variant="small" color="textSecondary">{t('home.metaDiaria')}</ThemedText>
              <Input
                value={metaTexto}
                onChangeText={setMetaTexto}
                keyboardType="number-pad"
                placeholder="0"
                autoFocus
                style={[styles.pesoInput, erroMeta && { borderColor: colors.error }]}
              />
              <MensagemErro texto={erroMeta} />
              <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>{t('home.metaAviso')}</ThemedText>
              <View style={styles.editButtons}>
                <Button label={t('comum.cancelar')} variant="outline" size="sm" onPress={() => setEditandoMeta(false)} style={{ marginRight: spacing.sm }} />
                <Button label={t('comum.salvar')} variant="primary" size="sm" onPress={handleSalvarMeta} disabled={!(metaNumero >= 800 && metaNumero <= 6000)} />
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => { setMetaTexto(profile.metaKcalDia ? String(profile.metaKcalDia) : ''); setEditandoMeta(true); }}
              hitSlop={8}
              style={{ marginTop: spacing.sm }}
            >
              <ThemedText variant="small" color="primary">
                {profile.metaKcalDia ? t('home.alterarMeta') : t('home.definirMeta')}
              </ThemedText>
            </Pressable>
          )}

          <ThemedText variant="subheading" color="text" style={{ marginTop: spacing.lg }}>{t('home.nutrientes')}</ThemedText>
          <View style={styles.statsGrid}>
            <Stat icone={<Beef size={18} color={colors.secondary} strokeWidth={2.25} />} valor={proteinaHojeG} rotulo={t('home.proteina')} cor="secondary" fundo={colors.secondarySoft} pct={partes.proteina} />
            <Stat icone={<Wheat size={18} color={colors.accent} strokeWidth={2.25} />} valor={carboidratoHojeG} rotulo={t('home.carbo')} cor="accent" fundo={colors.accentSoft} pct={partes.carboidrato} />
          </View>
          <View style={styles.statsGrid}>
            <Stat icone={<Nut size={18} color={colors.secondary} strokeWidth={2.25} />} valor={gorduraHojeG} rotulo={t('home.gordura')} cor="secondary" fundo={colors.secondarySoft} pct={partes.gordura} />
            <Stat icone={<Leaf size={18} color={colors.primary} strokeWidth={2.25} />} valor={fibraHojeG} rotulo={t('home.fibra')} cor="primary" fundo={colors.primarySoft} />
          </View>
          <View style={styles.statsGrid}>
            <Stat largo icone={<Droplet size={18} color={colors.accent} strokeWidth={2.25} />} valor={aguaHojeMl} rotulo={t('home.agua')} cor="accent" fundo={colors.accentSoft} />
            <Stat largo icone={<Zap size={18} color={colors.secondary} strokeWidth={2.25} />} valor={gastoHoje} rotulo={t('home.kcalGastas')} cor="secondary" fundo={colors.secondarySoft} />
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

        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="caption" color="textSecondary" style={styles.sobretitulo}>{t('home.constanciaTitulo')}</ThemedText>
          <ThemedText variant="title" color="primary" style={{ marginTop: spacing.xs }}>
            {t('home.diasDeSete', { dias: semana.atual.diasComRefeicao })}
          </ThemedText>
          {semana.atual.diasComRefeicao > 0 && (
            <ThemedText variant="small" color="textSecondary" style={{ marginBottom: spacing.md }}>{t('home.cuidouDeSi')}</ThemedText>
          )}
          <BarrasKcal barras={semana.barras} />
          <Pressable onPress={() => router.push('/evolucao')} style={styles.verEvolucao} hitSlop={8}>
            <TrendingDown size={14} color={colors.primary} strokeWidth={2} />
            <ThemedText variant="small" color="primary" style={{ marginLeft: spacing.xs }}>{t('home.verEvolucao')}</ThemedText>
            <ChevronRight size={14} color={colors.primary} strokeWidth={2} />
          </Pressable>
        </ThemedView>

        <View style={styles.status}>
          <ThemedText variant="caption" color="textSecondary">Leviã v{Constants.expoConfig?.version ?? ''}</ThemedText>
        </View>
      </ThemedView>
    </TelaRolavel>
  );
}

function Stat({
  icone, valor, rotulo, cor, fundo, largo, pct,
}: {
  icone: React.ReactNode;
  valor: number;
  rotulo: string;
  cor: 'primary' | 'secondary' | 'accent';
  fundo: string;
  largo?: boolean;
  /** parte das calorias dos macros (0–100); sem valor, não mostra a barra */
  pct?: number;
}) {
  const t = useT();
  return (
    <View style={[styles.statChip, largo && styles.statLargo, { backgroundColor: fundo }]}>
      {icone}
      <ThemedText variant="subheading" color={cor} style={{ marginTop: 2 }}>{valor}</ThemedText>
      <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>{rotulo}</ThemedText>
      {pct !== undefined && (
        <>
          <View style={styles.barraFundo}>
            <View style={[styles.barraCheia, { width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: colors[cor] }]} />
          </View>
          <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>{t('home.pctKcal', { pct })}</ThemedText>
        </>
      )}
    </View>
  );
}

const styles = estilosTema(() => ({
  sobretitulo: { textTransform: 'uppercase', letterSpacing: 1 },
  anelLinha: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  chipCuidado: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: 2, paddingHorizontal: spacing.sm, borderRadius: radius.full },
  barraFundo: { alignSelf: 'stretch', height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: spacing.xs, marginHorizontal: spacing.sm, overflow: 'hidden' },
  barraCheia: { height: 4, borderRadius: 2 },
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
