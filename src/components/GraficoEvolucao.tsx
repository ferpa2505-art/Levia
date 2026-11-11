import { useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Polyline, Circle } from 'react-native-svg';
import { ThemedText } from '@components/ThemedText';
import { usePreferences } from '@context/PreferencesContext';
import type { Barra, PontoPeso } from '@utils/evolucao';
import { diaNumero } from '@utils/tendenciaPeso';
import { colors, spacing } from '@constants/colors';

const ALTURA_BARRAS = 120;
const ALTURA_LINHA = 90;
const MARGEM = 8;

function dataCurta(dataIso: string, idioma: string) {
  const [a, m, d] = dataIso.split('-').map(Number);
  try {
    return new Date(a, m - 1, d, 12).toLocaleDateString(idioma, { day: '2-digit', month: '2-digit' });
  } catch {
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
  }
}

/** Barras de kcal por dia (ou por semana/mês nos períodos longos); barra cinza = sem registro */
export function BarrasKcal({ barras }: { barras: Barra[] }) {
  const { t, idioma } = usePreferences();
  const [largura, setLargura] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width);
  const maior = Math.max(...barras.map((b) => b.kcal), 1);
  const n = barras.length;
  const passo = largura > 0 ? largura / n : 0;
  const larguraBarra = Math.max(2, passo * 0.62);

  return (
    <View onLayout={onLayout} accessibilityLabel={t('evo.grafico')}>
      {largura > 0 && (
        <Svg width={largura} height={ALTURA_BARRAS}>
          {barras.map((b, i) => {
            const h = b.kcal > 0 ? Math.max(4, (b.kcal / maior) * (ALTURA_BARRAS - MARGEM)) : 3;
            return (
              <Rect
                key={b.de}
                x={i * passo + (passo - larguraBarra) / 2}
                y={ALTURA_BARRAS - h}
                width={larguraBarra}
                height={h}
                rx={Math.min(6, larguraBarra / 2)}
                fill={b.kcal > 0 ? colors.primary : colors.border}
              />
            );
          })}
        </Svg>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
        <ThemedText variant="caption" color="textSecondary">{dataCurta(barras[0].de, idioma)}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">{dataCurta(barras[n - 1].ate, idioma)}</ThemedText>
      </View>
    </View>
  );
}

/** Linha simples com as pesagens do período */
export function LinhaPeso({ pesos }: { pesos: PontoPeso[] }) {
  const { idioma } = usePreferences();
  const [largura, setLargura] = useState(0);
  if (pesos.length < 2) return null;
  const d0 = diaNumero(pesos[0].data);
  const d1 = diaNumero(pesos[pesos.length - 1].data);
  const vals = pesos.map((p) => p.pesoKg);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const faixa = max - min || 1;
  const x = (data: string) => (d1 === d0 ? largura / 2 : MARGEM + ((diaNumero(data) - d0) / (d1 - d0)) * (largura - 2 * MARGEM));
  const y = (kg: number) => MARGEM + (1 - (kg - min) / faixa) * (ALTURA_LINHA - 2 * MARGEM);

  return (
    <View onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      {largura > 0 && (
        <Svg width={largura} height={ALTURA_LINHA}>
          <Polyline
            points={pesos.map((p) => `${x(p.data)},${y(p.pesoKg)}`).join(' ')}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {pesos.map((p) => (
            <Circle key={p.data} cx={x(p.data)} cy={y(p.pesoKg)} r={3.5} fill={colors.primary} />
          ))}
        </Svg>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
        <ThemedText variant="caption" color="textSecondary">{dataCurta(pesos[0].data, idioma)}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">{dataCurta(pesos[pesos.length - 1].data, idioma)}</ThemedText>
      </View>
    </View>
  );
}
