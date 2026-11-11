import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { colors, spacing } from '@constants/colors';
import type { GrupoMuscular } from '@/types/fitness';
import { ThemedText } from '@components/ThemedText';
import { usePreferences } from '@context/PreferencesContext';
import { chaveGrupo } from '@utils/fitnessRotulos';
import { MUSCULOS_COSTAS, MUSCULOS_FRENTE, MusculoCorpo } from '@constants/musculosCorpo';

export type Sexo = 'feminino' | 'masculino';
export type Vista = 'frente' | 'costas';

/**
 * Mapa muscular: caminhos SVG do pacote body-muscles (Apache-2.0, ver docs/third-party/body-muscles).
 * Cada músculo é ligado a um dos grupos do Guia de Treinos e pinta conforme as séries da semana.
 */

// viewBox de cada vista no pacote original
const VIEWBOX: Record<Vista, { x: number; w: number }> = {
  frente: { x: 0, w: 35 },
  costas: { x: 37, w: 35 },
};

/** Grupo do Guia para um músculo do pacote (null = não conta, ex.: cabeça, mãos, pés). */
export function grupoDoMusculo(id: string): GrupoMuscular | null {
  if (id.startsWith('chest-')) return 'peito';
  if (id.startsWith('shoulder-') || id.startsWith('deltoid-')) return 'ombros';
  if (id.startsWith('biceps-')) return 'biceps';
  if (id.startsWith('triceps-')) return 'triceps';
  if (id.startsWith('forearm-')) return 'antebraco';
  if (id.startsWith('abs-') || id.startsWith('obliques-') || id.startsWith('serratus-')) return 'core';
  if (id.startsWith('quads-') || id.startsWith('adductors-')) return 'quadriceps';
  if (id.startsWith('hamstrings-')) return 'posteriores';
  if (id.startsWith('gluteus-')) return 'gluteos';
  if (id.startsWith('calves-')) return 'panturrilha';
  if (id.startsWith('lats-') || id.startsWith('traps-') || id === 'spine' || id.startsWith('lower-back-') || id === 'nape') return 'costas';
  return null;
}

/** Intensidade 0–1 por grupo: séries feitas na semana ÷ 10 séries por grupo. */
export function intensidadePorGrupo(series: Partial<Record<GrupoMuscular, number>>, metaSeries = 10): Partial<Record<GrupoMuscular, number>> {
  const saida: Partial<Record<GrupoMuscular, number>> = {};
  for (const [g, n] of Object.entries(series) as [GrupoMuscular, number][]) {
    saida[g] = Math.min(1, n / metaSeries);
  }
  return saida;
}

const LARGURA_PADRAO = 170;

export function BonecoMuscular({
  sexo,
  vista,
  intensidade,
  largura = LARGURA_PADRAO,
}: {
  sexo: Sexo;
  vista: Vista;
  intensidade: Partial<Record<GrupoMuscular, number>>;
  largura?: number;
}) {
  const musculos: MusculoCorpo[] = vista === 'frente' ? MUSCULOS_FRENTE : MUSCULOS_COSTAS;
  const { x, w } = VIEWBOX[vista];
  const altura = (largura * 93) / w;
  const centro = x + w / 2;
  // feminino: figura um pouco mais estreita, mantendo a mesma altura
  const transformacao = sexo === 'feminino'
    ? `translate(${centro} 0) scale(0.92 1) translate(${-centro} 0)`
    : undefined;

  return (
    <Svg width={largura} height={altura} viewBox={`${x} 0 ${w} 93`}>
      <G transform={transformacao}>
        {/* silhueta: todos os músculos em cinza claro, formando o contorno */}
        {musculos.map((m) => (
          <Path key={`base-${m.id}`} d={m.d} fill={colors.border} stroke={colors.textSecondary} strokeOpacity={0.35} strokeWidth={0.12} />
        ))}
        {/* músculos treinados na semana, pintados pelo grupo */}
        {musculos.map((m) => {
          const grupo = grupoDoMusculo(m.id);
          const f = grupo ? intensidade[grupo] ?? 0 : 0;
          if (f <= 0) return null;
          return <Path key={`cor-${m.id}`} d={m.d} fill={colors.primary} fillOpacity={0.25 + 0.75 * f} />;
        })}
      </G>
    </Svg>
  );
}

/** Figura com troca frente/costas, legenda com o nome de cada grupo e as séries da semana. */
export function MapaMuscular({
  sexo,
  series,
}: {
  sexo: Sexo;
  series: Partial<Record<GrupoMuscular, number>>;
}) {
  const { t } = usePreferences();
  const [vista, setVista] = useState<Vista>('frente');
  const intensidade = intensidadePorGrupo(series);
  const musculos = vista === 'frente' ? MUSCULOS_FRENTE : MUSCULOS_COSTAS;
  const grupos = [...new Set(musculos.map((m) => grupoDoMusculo(m.id)).filter((g): g is GrupoMuscular => g !== null))];

  return (
    <View style={styles.wrap}>
      <View style={styles.botoes}>
        {(['frente', 'costas'] as Vista[]).map((v) => (
          <Pressable key={v} onPress={() => setVista(v)} style={[styles.botao, vista === v && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <ThemedText variant="small" color={vista === v ? 'surface' : 'text'}>
              {v === 'frente' ? t('fitness.mapa.frente') : t('fitness.mapa.costas')}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      <BonecoMuscular sexo={sexo} vista={vista} intensidade={intensidade} />
      <View style={styles.legenda}>
        {grupos.map((g) => (
          <View key={g} style={styles.item}>
            <View style={[styles.cor, { backgroundColor: colors.primary, opacity: 0.25 + 0.75 * (intensidade[g] ?? 0) }]} />
            <ThemedText variant="small" color="text">{t(chaveGrupo(g))}</ThemedText>
            <ThemedText variant="small" color="textSecondary">{series[g] ?? 0}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm },
  botoes: { flexDirection: 'row', gap: spacing.sm },
  botao: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  cor: { width: 10, height: 10, borderRadius: 5 },
});
