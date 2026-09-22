import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { colors, typography } from '@constants/colors';

/**
 * Marca "LEVIÃ" com a pena da marca posicionada sobre o til do "Ã",
 * substituindo o til tipográfico comum pelo desenho da pena.
 *
 * Como o React Native não permite reposicionar acentos de uma fonte,
 * usamos a letra "A" (sem til) e sobrepomos a pena, rotacionada, logo
 * acima dela — no lugar exato onde o til apareceria.
 */

interface LeviaWordmarkProps extends ViewProps {
  /** Tamanho de referência da fonte (padrão: 30, igual ao variant="title") */
  size?: number;
  /** Cor do texto "LEVI" + "A" */
  color?: string;
  /** Cor da pena (padrão: igual à cor do texto) */
  featherColor?: string;
  /** Cor do ponto pêssego da pena */
  dotColor?: string;
}

// Pena reaproveitada de LeviaLogo.tsx, recortada (sem fundo) para uso em miniatura
const svgPena = (corPena: string, corPonto: string) => `
<svg viewBox="70 20 165 185" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M 128 40
       C 128 40, 110 60, 110 95
       C 110 130, 120 150, 130 170
       C 135 180, 140 185, 145 190
       L 148 195
       C 148 195, 145 185, 145 170
       C 145 155, 150 140, 160 140
       C 170 140, 175 155, 175 170
       C 175 185, 172 195, 172 195
       L 175 190
       C 185 170, 195 150, 195 95
       C 195 60, 177 40, 128 40 Z"
    fill="${corPena}"
  />
  <circle cx="165" cy="185" r="12" fill="${corPonto}" opacity="0.95"/>
</svg>
`;

export function LeviaWordmark({
  size = 30,
  color,
  featherColor,
  dotColor = '#F59E0B',
  style,
  ...rest
}: LeviaWordmarkProps) {
  const corTexto = color || colors.text;
  const corPena = featherColor || corTexto;
  const tamanhoPena = size * 0.8;

  return (
    <View style={[styles.linha, style]} {...rest}>
      <Text style={[styles.letras, { fontSize: size, color: corTexto }]}>LEVI</Text>
      <View style={[styles.slotA, { minWidth: size * 0.7 }]}>
        <View
          style={[
            styles.slotPena,
            {
              width: tamanhoPena,
              height: tamanhoPena,
              top: -size * 0.66,
            },
          ]}
        >
          <SvgXml xml={svgPena(corPena, dotColor)} width={tamanhoPena} height={tamanhoPena} />
        </View>
        <Text style={[styles.letras, { fontSize: size, color: corTexto }]}>A</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-end' },
  letras: {
    fontWeight: typography.weight.bold,
    letterSpacing: 4,
  },
  slotA: {
    alignItems: 'center',
    position: 'relative',
  },
  slotPena: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '72deg' }],
  },
});
