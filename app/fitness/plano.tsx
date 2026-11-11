import { useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeftRight, Copy, Pencil, Trash2 } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { useFitness } from '@context/FitnessContext';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import { nomeDiaSemana, PlanoInicialId } from '@utils/fitnessLogica';

const PLANOS_INICIAIS: { id: PlanoInicialId; chave: 'fitness.planoPPL' | 'fitness.planoUpperLower' | 'fitness.planoFullBody' | 'fitness.planoCincoPorCinco' }[] = [
  { id: 'ppl', chave: 'fitness.planoPPL' },
  { id: 'upperLower', chave: 'fitness.planoUpperLower' },
  { id: 'fullBody', chave: 'fitness.planoFullBody' },
  { id: 'cincoPorCinco', chave: 'fitness.planoCincoPorCinco' },
];

export default function PlanoSemanal() {
  const { t, idioma } = usePreferences();
  const router = useRouter();
  const { rotinas, plano, config, definirDia, trocarDias, aplicarPlanoInicial, removerRotina, copiarRotina } = useFitness();
  const [diaEscolhido, setDiaEscolhido] = useState<number | null>(null);
  const [trocando, setTrocando] = useState<number | null>(null);

  // ordem de exibição conforme a configuração de início da semana
  const ordem = config.inicioSemana === 'dom' ? [6, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];

  function tocarDia(indice: number) {
    if (trocando !== null) {
      if (trocando !== indice) void trocarDias(trocando, indice);
      setTrocando(null);
      return;
    }
    setDiaEscolhido(diaEscolhido === indice ? null : indice);
  }

  // confirmação dentro da própria tela (não depende da caixa do navegador, que pode ser bloqueada)
  const [planoPendente, setPlanoPendente] = useState<{ id: PlanoInicialId; rotulo: string } | null>(null);

  async function aplicarPendente() {
    if (!planoPendente) return;
    const { id } = planoPendente;
    setPlanoPendente(null);
    await aplicarPlanoInicial(id);
  }

  function confirmarExclusao(id: string, nome: string) {
    Alert.alert(t('fitness.excluirRotina'), `${nome}\n\n${t('fitness.confirmarExcluir')}`, [
      { text: t('comum.cancelar'), style: 'cancel' },
      { text: t('fitness.excluirRotina'), style: 'destructive', onPress: () => void removerRotina(id) },
    ]);
  }

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <ThemedText variant="small" color="textSecondary">
          {trocando !== null ? t('fitness.escolhaOutroDia') : t('fitness.toqueParaDefinir')}
        </ThemedText>

        <ThemedView variant="surface" style={styles.card}>
          {ordem.map((indice) => {
            const rotinaId = plano.semana[indice];
            const rotina = rotinas.find((r) => r.id === rotinaId);
            const aberto = diaEscolhido === indice;
            const origem = trocando === indice;
            return (
              <View key={indice} style={[styles.bloco, origem && { backgroundColor: colors.primarySoft }]}>
                <View style={styles.linhaDia}>
                  <Pressable onPress={() => tocarDia(indice)} style={styles.dia} accessibilityRole="button">
                    <ThemedText variant="body" color="text" style={styles.nomeDia}>
                      {nomeDiaSemana(indice, idioma, 'long')}
                    </ThemedText>
                    <ThemedText variant="small" color={rotina ? 'primary' : 'textSecondary'} style={{ flex: 1 }}>
                      {rotina ? rotina.nome : t('fitness.diaDescanso')}
                    </ThemedText>
                  </Pressable>
                  {trocando === null && (
                    <Pressable onPress={() => setTrocando(indice)} hitSlop={8} accessibilityLabel={t('fitness.trocarDia')}>
                      <ArrowLeftRight size={18} color={colors.textSecondary} strokeWidth={2} />
                    </Pressable>
                  )}
                </View>
                {aberto && trocando === null && (
                  <View style={styles.opcoes}>
                    {rotinas.map((r) => (
                      <Pressable key={r.id} onPress={() => { void definirDia(indice, r.id); setDiaEscolhido(null); }} style={styles.opcao}>
                        <ThemedText variant="body" color="text">{r.nome}</ThemedText>
                      </Pressable>
                    ))}
                    <Pressable onPress={() => { void definirDia(indice, null); setDiaEscolhido(null); }} style={styles.opcao}>
                      <ThemedText variant="body" color="textSecondary">{t('fitness.diaDescanso')}</ThemedText>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
          {trocando !== null && (
            <Button label={t('comum.cancelar')} variant="outline" onPress={() => setTrocando(null)} />
          )}
        </ThemedView>

        <ThemedText variant="subheading" color="text" style={{ marginTop: spacing.sm }}>{t('fitness.planosProntos')}</ThemedText>
        {PLANOS_INICIAIS.map((p) => (
          <Button key={p.id} label={t(p.chave)} variant="outline" onPress={() => setPlanoPendente({ id: p.id, rotulo: t(p.chave) })} />
        ))}
        {planoPendente && (
          <ThemedView variant="surface" style={styles.card}>
            <ThemedText variant="subheading" color="text">{t('fitness.aplicarPlano')}: {planoPendente.rotulo}</ThemedText>
            <ThemedText variant="small" color="textSecondary">{t('fitness.aplicarPlanoAviso')}</ThemedText>
            <Button label={t('fitness.aplicar')} onPress={() => void aplicarPendente()} />
            <Button label={t('comum.cancelar')} variant="outline" onPress={() => setPlanoPendente(null)} />
          </ThemedView>
        )}

        <View style={styles.cabecalhoRotinas}>
          <ThemedText variant="subheading" color="text">{t('fitness.minhasRotinas')}</ThemedText>
          <Pressable onPress={() => router.push('/fitness/rotina/novo')} hitSlop={8}>
            <ThemedText variant="small" color="primary">{t('fitness.novaRotina')}</ThemedText>
          </Pressable>
        </View>

        {rotinas.length === 0 && (
          <ThemedText variant="small" color="textSecondary">{t('fitness.semRotinas')}</ThemedText>
        )}
        {rotinas.map((r) => (
          <ThemedView key={r.id} variant="surface" style={styles.rotina}>
            <View style={{ flex: 1 }}>
              <ThemedText variant="body" color="text">{r.nome}</ThemedText>
              <ThemedText variant="small" color="textSecondary">
                {r.exercicios.length} {t('fitness.exercicios')}
              </ThemedText>
            </View>
            <Pressable onPress={() => router.push(`/fitness/rotina/${r.id}`)} hitSlop={8} accessibilityLabel={t('fitness.editar')}>
              <Pencil size={18} color={colors.primary} strokeWidth={2} />
            </Pressable>
            <Pressable onPress={() => void copiarRotina(r.id)} hitSlop={8} accessibilityLabel={t('fitness.copiarRotina')} style={{ marginLeft: spacing.md }}>
              <Copy size={18} color={colors.primary} strokeWidth={2} />
            </Pressable>
            <Pressable onPress={() => confirmarExclusao(r.id, r.nome)} hitSlop={8} accessibilityLabel={t('fitness.excluirRotina')} style={{ marginLeft: spacing.md }}>
              <Trash2 size={18} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
          </ThemedView>
        ))}
      </ThemedView>
    </TelaRolavel>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.sm },
  linhaDia: { paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md },
  dia: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nomeDia: { width: 110 },
  bloco: { borderRadius: radius.md, paddingHorizontal: spacing.sm },
  opcoes: { marginBottom: spacing.sm, backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  opcao: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  cabecalhoRotinas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  rotina: { borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center' },
});
