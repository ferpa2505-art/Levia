import { View, Image, StyleProp, ViewStyle } from 'react-native';
import { colors } from '@constants/colors';

/**
 * Pena oficial do Levia, com o ponto pêssego.
 *
 * A pena é uma "máscara" branca que recebe a cor pelo tintColor — assim ela
 * acompanha o tema do app (sálvia, azul-petróleo, etc.). O ponto pêssego é
 * desenhado por cima, sempre na mesma posição do logo original.
 *
 * Uso: <LeviaPena size={40} />   (size = altura em pixels)
 */

const imgPena = require('../assets/images/levia-pena-mascara.png');

// Proporções medidas no logo original (384 x 591 px)
const PROPORCAO = 384 / 591;     // largura / altura
const PONTO_X = 229 / 384;       // centro do ponto (horizontal)
const PONTO_Y = 460 / 591;       // centro do ponto (vertical)
const PONTO_DIAMETRO = 60 / 384; // diâmetro do ponto (em relação à largura)

type Props = {
  size?: number;
  corPena?: string;
  corPonto?: string;
  style?: StyleProp<ViewStyle>;
};

export function LeviaPena({
  size = 40,
  corPena = colors.primary,
  corPonto = colors.secondary,
  style,
}: Props) {
  const altura = size;
  const largura = size * PROPORCAO;
  const diametro = largura * PONTO_DIAMETRO;

  return (
    <View style={[{ width: largura, height: altura }, style]}>
      <Image
        source={imgPena}
        style={{ width: largura, height: altura, tintColor: corPena }}
        resizeMode="contain"
      />
      <View
        style={{
          position: 'absolute',
          width: diametro,
          height: diametro,
          borderRadius: diametro / 2,
          backgroundColor: corPonto,
          left: largura * PONTO_X - diametro / 2,
          top: altura * PONTO_Y - diametro / 2,
        }}
      />
    </View>
  );
}
