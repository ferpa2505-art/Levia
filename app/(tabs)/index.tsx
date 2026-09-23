import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
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

export default function HomeScreen() {
  const router = useRouter();
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
              Olá{nome ? `, ${nome}` : ''}! 👋
            </ThemedText>
          </View>
          <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            Bem-vindo ao seu acompanhamento de saúde
          </ThemedText>
        </View>

        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <ThemedText variant="subheading" color="text">Resumo de Hoje</ThemedText>
          <View style={styles.statsGrid}>
            <View style={[styles.statChip, { backgroundColor: 'rgba(111,165,142,0.12)' }]}>
              <Flame size={20} color={colors.primary} strokeWidth={2.25} style={styles.statIcone} />
              <ThemedText variant="heading" color="primary">{kcalHoje}</ThemedText>
              <ThemedText variant="small" color="textSecondary">kcal</ThemedText>
            </View>
            <View style={[styles.statChip, { backgroundColor: 'rgba(244,169,131,0.18)' }]}>
              <Beef size={20} color={colors.secondary} strokeWidth={2.25} style={styles.statIcone} />
              <ThemedText variant="heading" color="secondary">{proteinaHojeG}</ThemedText>
              <ThemedText variant="small" color="textSecondary">g proteína</ThemedText>
            </View>
            <View style={[styles.statChip, { backgroundColor: 'rgba(183,166,224,0.18)' }]}>
              <Droplet size={20} color={colors.accent} strokeWidth={2.25} style={styles.statIcone} />
              <ThemedText variant="heading" color="accent">{aguaHojeMl}</ThemedText>
              <ThemedText variant="small" color="textSecondary">ml água</ThemedText>
            </View>
            <View style={[styles.statChip, { backgroundColor: 'rgba(244,169,131,0.12)' }]}>
              <Zap size={20} color={colors.secondary} strokeWidth={2.25} style={styles.statIcone} />
              <ThemedText variant="heading" color="secondary">{kcalGastaHoje}</ThemedText>
              <ThemedText variant="small" color="textSecondary">kcal gastas</ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
          <View style={styles.pesoHeader}>
            <View style={styles.pesoTituloRow}>
              <Feather size={18} color={colors.primary} strokeWidth={2} />
              <ThemedText variant="subheading" color="text" style={{ marginLeft: spacing.xs }}>
                Seu Peso
              </ThemedText>
            </View>
            {!editandoPeso && (
              <Button
                label="Atualizar"
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
                <Button label="Cancelar" variant="outline" size="sm" onPress={() => setEditandoPeso(false)} style={{ marginRight: spacing.sm }} />
                <Button label="Salvar" variant="primary" size="sm" onPress={handleSalvarPeso} />
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
                    {jaNaMeta ? 'Você está na sua meta! 🎉' : `Meta: ${profile.metaPesoKg} kg · faltam ${diferenca} kg`}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText variant="small" color="textSecondary">Última pesagem: --</ThemedText>
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
              <ThemedText variant="subheading" color="text">Modo GLP-1</ThemedText>
              <ThemedText variant="small" color="textSecondary">
                Doses, rodízio de aplicação, sintomas e lembretes
              </ThemedText>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </ThemedView>
        </Pressable>

        <View style={styles.status}>
          <ThemedText variant="caption" color="textSecondary">v0.1.0 • Fase 1 de Desenvolvimento</ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(111,165,142,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
