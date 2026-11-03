import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from '@components/ThemedText';
import { colors } from '@constants/colors';

const TAMANHO = 112;
const TRACO = 10;

/**
 * Anel das calorias do dia. Com meta, o anel enche até a meta (e para no cheio, sem mudar de cor:
 * passar da meta não é "erro"). Sem meta, mostra o anel cheio em tom suave e só o número.
 */
export function AnelKcal({ kcal, meta }: { kcal: number; meta: number | null }) {
  const raio = (TAMANHO - TRACO) / 2;
  const circ = 2 * Math.PI * raio;
  const fracao = meta && meta > 0 ? Math.min(1, kcal / meta) : 0;
  const c = TAMANHO / 2;

  return (
    <View style={{ width: TAMANHO, height: TAMANHO, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={TAMANHO} height={TAMANHO}>
        <Circle cx={c} cy={c} r={raio} stroke={colors.primarySoft} strokeWidth={TRACO} fill="none" />
        {fracao > 0 && (
          <Circle
            cx={c}
            cy={c}
            r={raio}
            stroke={colors.primary}
            strokeWidth={TRACO}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ * fracao} ${circ}`}
            transform={`rotate(-90 ${c} ${c})`}
          />
        )}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <ThemedText variant="heading" color="text" style={{ fontSize: 24 }}>
          {Math.round(kcal).toLocaleString()}
        </ThemedText>
      </View>
    </View>
  );
}
