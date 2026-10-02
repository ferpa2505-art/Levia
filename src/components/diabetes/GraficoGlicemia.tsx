import { useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Line, Polyline, Circle } from 'react-native-svg';
import { ThemedText } from '@components/ThemedText';
import type { RegistroGlicemia } from '@models/diabetes';
import { colors, spacing } from '@constants/colors';
import { usePreferences } from '@context/PreferencesContext';
import { valorMgDl, momentoGlicemia, media } from '@utils/glicemia';

interface Props {
  /** Medições já filtradas pelo período, da mais antiga para a mais recente */
  glicemias: RegistroGlicemia[];
  /** Início do período mostrado no eixo X */
  inicio: Date;
  alvoMin: number;
  alvoMax: number;
  altura?: number;
}

/**
 * Gráfico das medições: faixa-alvo sombreada, linha tracejada da média do
 * período e pontos coloridos (dentro da faixa, abaixo ou acima).
 */
export function GraficoGlicemia({ glicemias, inicio, alvoMin, alvoMax, altura = 150 }: Props) {
  const { t, idioma } = usePreferences();
  const [largura, setLargura] = useState(0);

  const valores = glicemias.map(valorMgDl);
  const mediaPeriodo = media(valores);
  const min = Math.min(...valores, alvoMin) - 15;
  const max = Math.max(...valores, alvoMax) + 15;
  const margem = 8;
  const fim = Date.now();
  const t0 = inicio.getTime();

  const x = (g: RegistroGlicemia) =>
    margem + ((momentoGlicemia(g).getTime() - t0) / Math.max(fim - t0, 1)) * (largura - margem * 2);
  const y = (v: number) => margem + (1 - (v - min) / (max - min)) * (altura - margem * 2);

  const corPonto = (v: number) => (v < alvoMin ? colors.error : v > alvoMax ? colors.warning : colors.primary);

  const formatar = (d: Date) => {
    try {
      return d.toLocaleDateString(idioma, { day: '2-digit', month: '2-digit' });
    } catch {
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }
  };

  return (
    <View onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}>
      {largura > 0 && (
        <Svg width={largura} height={altura}>
          <Rect
            x={margem}
            y={y(alvoMax)}
            width={largura - margem * 2}
            height={y(alvoMin) - y(alvoMax)}
            fill={colors.primarySoft}
            rx={6}
          />
          <Line
            x1={margem}
            x2={largura - margem}
            y1={y(mediaPeriodo)}
            y2={y(mediaPeriodo)}
            stroke={colors.secondary}
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          {glicemias.length > 1 && (
            <Polyline
              points={glicemias.map((g, i) => `${x(g)},${y(valores[i])}`).join(' ')}
              fill="none"
              stroke={colors.textSecondary}
              strokeOpacity={0.5}
              strokeWidth={1.5}
            />
          )}
          {glicemias.map((g, i) => (
            <Circle key={g.id} cx={x(g)} cy={y(valores[i])} r={4} fill={corPonto(valores[i])} />
          ))}
        </Svg>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
        <ThemedText variant="caption" color="textSecondary">{formatar(inicio)}</ThemedText>
        <ThemedText variant="caption" color="secondary">{t('gl.media', { v: mediaPeriodo })}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">{formatar(new Date())}</ThemedText>
      </View>
    </View>
  );
}
