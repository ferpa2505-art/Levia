import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { useFitness } from '@context/FitnessContext';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';
import type { GrupoMuscular } from '@/types/fitness';
import {
  dataISO,
  estimativa1RM,
  minutosPorDia,
  pesoParaExibir,
  seriesDeTrabalhoFeitas,
  volumePorGrupo,
} from '@utils/fitnessLogica';
import { chaveGrupo } from '@utils/fitnessRotulos';

const SEMANAS = 53;

export default function EstatisticasFitness() {
  const { t } = usePreferences();
  const { sessoes, grupoDe, exercicioPorId, config } = useFitness();
  const [periodo, setPeriodo] = useState<7 | 30 | 365>(7);

  const hoje = new Date();
  const desde = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - periodo);

  // mapa de calor: 53 semanas × 7 dias, terminando hoje
  const minutos = useMemo(() => minutosPorDia(sessoes), [sessoes]);
  const colunas = useMemo(() => {
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const diaSemanaHoje = (fim.getDay() + 6) % 7;
    const inicio = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() - diaSemanaHoje - (SEMANAS - 1) * 7);
    const semanas: { data: string; min: number }[][] = [];
    for (let s = 0; s < SEMANAS; s++) {
      const coluna: { data: string; min: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const data = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + s * 7 + d);
        const iso = dataISO(data);
        coluna.push({ data: iso, min: data > fim ? -1 : minutos[iso] ?? 0 });
      }
      semanas.push(coluna);
    }
    return semanas;
  }, [minutos]);

  const volume = useMemo(
    () => volumePorGrupo(sessoes, grupoDe, dataISO(desde)),
    [sessoes, grupoDe, desde],
  );
  const maiorVolume = Math.max(1, ...Object.values(volume));
  const gruposComVolume = (Object.keys(volume) as GrupoMuscular[]).sort((a, b) => (volume[b] ?? 0) - (volume[a] ?? 0));

  // melhor 1RM estimado por exercício
  const melhores = useMemo(() => {
    const mapa = new Map<string, { nome: string; e1rm: number }>();
    for (const s of sessoes) {
      for (const serie of seriesDeTrabalhoFeitas(s.series)) {
        const e = estimativa1RM(serie.cargaKg ?? 0, serie.repeticoes);
        if (e === undefined) continue;
        const atual = mapa.get(serie.exercicioId);
        if (!atual || e > atual.e1rm) {
          mapa.set(serie.exercicioId, { nome: exercicioPorId(serie.exercicioId)?.nome ?? serie.exercicioId, e1rm: e });
        }
      }
    }
    return [...mapa.values()].sort((a, b) => b.e1rm - a.e1rm).slice(0, 10);
  }, [sessoes, exercicioPorId]);

  const totalMinutos = Object.values(minutos).reduce((a, b) => a + b, 0);

  return (
    <TelaRolavel>
      <ThemedView style={styles.container}>
        <ThemedView variant="surface" style={styles.card}>
          <ThemedText variant="subheading" color="text">{t('fitness.atividade')}</ThemedText>
          <ThemedText variant="small" color="textSecondary">
            {t('fitness.minutosTotais')}: {totalMinutos}
          </ThemedText>
          <View style={styles.mapa}>
            {colunas.map((coluna, i) => (
              <View key={i} style={styles.coluna}>
                {coluna.map((c) => (
                  <View
                    key={c.data}
                    style={[styles.celula, { backgroundColor: corCelula(c.min) }]}
                  />
                ))}
              </View>
            ))}
          </View>
        </ThemedView>

        <ThemedView variant="surface" style={styles.card}>
          <View style={styles.linha}>
            <ThemedText variant="subheading" color="text" style={{ flex: 1 }}>{t('fitness.volumePorGrupo')}</ThemedText>
            {([7, 30, 365] as const).map((p) => (
              <Pressable key={p} onPress={() => setPeriodo(p)} style={[styles.chip, periodo === p && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <ThemedText variant="small" color={periodo === p ? 'surface' : 'text'}>
                  {p === 7 ? t('fitness.periodo7') : p === 30 ? t('fitness.periodo30') : t('fitness.periodoAno')}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          {gruposComVolume.length === 0 && <ThemedText variant="small" color="textSecondary">{t('fitness.semDadosPeriodo')}</ThemedText>}
          {gruposComVolume.map((g) => (
            <View key={g} style={styles.barraLinha}>
              <ThemedText variant="small" color="text" style={{ width: 110 }}>{t(chaveGrupo(g))}</ThemedText>
              <View style={styles.trilho}>
                <View style={[styles.preenchimento, { width: `${((volume[g] ?? 0) / maiorVolume) * 100}%` }]} />
              </View>
              <ThemedText variant="small" color="textSecondary" style={{ width: 70, textAlign: 'right' }}>
                {Math.round(pesoParaExibir(volume[g] ?? 0, config.unidade))} {config.unidade}
              </ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView variant="surface" style={styles.card}>
          <ThemedText variant="subheading" color="text">{t('fitness.melhoresEstimativas')}</ThemedText>
          <ThemedText variant="small" color="textSecondary">{t('fitness.estimativaAviso')}</ThemedText>
          {melhores.length === 0 && <ThemedText variant="small" color="textSecondary">{t('fitness.semDados')}</ThemedText>}
          {melhores.map((m) => (
            <View key={m.nome} style={styles.linhaMelhor}>
              <ThemedText variant="body" color="text" style={{ flex: 1 }}>{m.nome}</ThemedText>
              <ThemedText variant="body" color="primary">
                {Math.round(pesoParaExibir(m.e1rm, config.unidade) * 10) / 10} {config.unidade}
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      </ThemedView>
    </TelaRolavel>
  );
}

function corCelula(min: number): string {
  if (min < 0) return 'transparent';
  if (min === 0) return colors.border;
  if (min < 30) return 'rgba(111,165,142,0.35)';
  if (min < 60) return 'rgba(111,165,142,0.65)';
  return colors.primary;
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  mapa: { flexDirection: 'row', gap: 2, marginTop: spacing.sm },
  coluna: { gap: 2 },
  celula: { width: 9, height: 9, borderRadius: 2 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  barraLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  trilho: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  preenchimento: { height: 10, backgroundColor: colors.primary, borderRadius: 5 },
  linhaMelhor: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
});
