import { useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { useFitness } from '@context/FitnessContext';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import { dataISO, pesoDeExibicao, pesoParaExibir } from '@utils/fitnessLogica';

export default function PesoFitness() {
  const { t } = usePreferences();
  const { pesagens, metaPesoKg, config, adicionarPesagem, removerPesagem, definirMetaPeso } = useFitness();
  const unidade = config.unidade;
  const [novoPeso, setNovoPeso] = useState('');
  const [meta, setMeta] = useState(metaPesoKg !== undefined ? String(pesoParaExibir(metaPesoKg, unidade)) : '');

  // ordem cronológica para o gráfico (mais antigo à esquerda)
  const cronologica = [...pesagens].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  const serie = cronologica.slice(-30);
  const valores = serie.map((p) => p.kg);
  const min = valores.length ? Math.min(...valores, metaPesoKg ?? Infinity) : 0;
  const max = valores.length ? Math.max(...valores, metaPesoKg ?? -Infinity) : 1;
  const faixa = max - min || 1;
  const atual = pesagens[0]?.kg;
  const variacao = cronologica.length >= 2 ? cronologica[cronologica.length - 1].kg - cronologica[0].kg : undefined;

  async function salvarPeso() {
    const n = parseFloat(novoPeso.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return;
    await adicionarPesagem(pesoDeExibicao(n, unidade), dataISO());
    setNovoPeso('');
  }

  async function salvarMeta() {
    const n = parseFloat(meta.replace(',', '.'));
    await definirMetaPeso(Number.isFinite(n) && n > 0 ? pesoDeExibicao(n, unidade) : undefined);
  }

  function confirmarRemocao(id: string) {
    Alert.alert(t('fitness.excluirPesagem'), t('fitness.confirmarExcluir'), [
      { text: t('comum.cancelar'), style: 'cancel' },
      { text: t('fitness.excluirPesagem'), style: 'destructive', onPress: () => void removerPesagem(id) },
    ]);
  }

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <ThemedView variant="surface" style={styles.card}>
          <ThemedText variant="small" color="textSecondary">{t('fitness.pesoAtual')}</ThemedText>
          <ThemedText variant="heading" color="text">
            {atual !== undefined ? `${pesoParaExibir(atual, unidade)} ${unidade}` : '--'}
          </ThemedText>
          {metaPesoKg !== undefined && atual !== undefined && (
            <ThemedText variant="small" color="textSecondary">
              {t('fitness.metaPeso')}: {pesoParaExibir(metaPesoKg, unidade)} {unidade} · {t('fitness.faltam')}{' '}
              {Math.abs(Math.round((pesoParaExibir(atual, unidade) - pesoParaExibir(metaPesoKg, unidade)) * 10) / 10)} {unidade}
            </ThemedText>
          )}
          {variacao !== undefined && (
            <ThemedText variant="small" color="textSecondary">
              {t('fitness.variacao')}: {variacao > 0 ? '+' : ''}{pesoParaExibir(variacao, unidade)} {unidade}
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView variant="surface" style={styles.card}>
          <View style={styles.grafico}>
            {serie.map((p) => {
              const altura = 12 + ((p.kg - min) / faixa) * 80;
              return <View key={p.id} style={[styles.barra, { height: altura }]} />;
            })}
          </View>
          {serie.length === 0 && <ThemedText variant="small" color="textSecondary">{t('fitness.semPesagens')}</ThemedText>}
        </ThemedView>

        <ThemedView variant="surface" style={styles.card}>
          <ThemedText variant="subheading" color="text">{t('fitness.registrarPeso')}</ThemedText>
          <View style={styles.linha}>
            <View style={{ flex: 1 }}>
              <Input keyboardType="decimal-pad" value={novoPeso} onChangeText={setNovoPeso} placeholder={unidade} />
            </View>
            <View style={{ width: spacing.sm }} />
            <View style={{ width: 120 }}>
              <Button label={t('fitness.salvar')} onPress={salvarPeso} disabled={!novoPeso.trim()} />
            </View>
          </View>
        </ThemedView>

        <ThemedView variant="surface" style={styles.card}>
          <ThemedText variant="subheading" color="text">{t('fitness.metaPeso')}</ThemedText>
          <View style={styles.linha}>
            <View style={{ flex: 1 }}>
              <Input keyboardType="decimal-pad" value={meta} onChangeText={setMeta} placeholder={unidade} />
            </View>
            <View style={{ width: spacing.sm }} />
            <View style={{ width: 120 }}>
              <Button label={t('fitness.salvar')} variant="outline" onPress={salvarMeta} />
            </View>
          </View>
        </ThemedView>

        {pesagens.map((p) => (
          <ThemedView key={p.id} variant="surface" style={styles.linhaPesagem}>
            <View style={{ flex: 1 }}>
              <ThemedText variant="body" color="text">{pesoParaExibir(p.kg, unidade)} {unidade}</ThemedText>
              <ThemedText variant="small" color="textSecondary">{p.data}</ThemedText>
            </View>
            <Pressable onPress={() => confirmarRemocao(p.id)} hitSlop={8} accessibilityLabel={t('fitness.excluirPesagem')}>
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
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  linha: { flexDirection: 'row', alignItems: 'center' },
  linhaPesagem: { borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center' },
  grafico: { height: 110, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barra: { flex: 1, backgroundColor: colors.primary, borderRadius: 3, opacity: 0.85 },
});
