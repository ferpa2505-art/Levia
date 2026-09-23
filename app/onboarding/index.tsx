import { View, StyleSheet, Pressable, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { ThemedText } from '@components/ThemedText';
import { colors, spacing, radius } from '@constants/colors';

/* ============================================================
 * AJUSTES FINOS — mude só estes números se precisar
 * ============================================================ */

// Cores do degradê (esquerda -> direita), iguais ao design do Canva
const COR_DEGRADE_INICIO = '#0798B0'; // azul-petróleo
const COR_DEGRADE_FIM = '#7ED957';    // verde

// Pena grande no canto superior esquerdo (em % da largura da tela)
const PENA_CANTO_LARGURA = 0.22;

// Nome "LEVIA" (em % da largura da tela)
const NOME_LARGURA = 0.72;

// Pena pequena em cima do "A"
const PENA_A_TAMANHO = 0.13;   // tamanho, em % da largura do nome
const PENA_A_ANGULO = '-75deg'; // giro (negativo = sentido anti-horário)
const PENA_A_DIREITA = -0.01;  // posição horizontal (em % da largura do nome)
const PENA_A_ACIMA = 0.95;     // quanto sobe acima do nome (em % da altura da pena)

// Slogan "Mais leve a cada dia." (em % da largura da tela)
const SLOGAN_LARGURA = 0.72;

/* ============================================================ */

// Proporções originais das imagens (largura / altura)
const PROPORCAO_SIMBOLO = 384 / 591;
const PROPORCAO_NOME = 569 / 95;
const PROPORCAO_SLOGAN = 500 / 48;

const imgSimbolo = require('../../src/assets/images/levia-simbolo.png');
const imgNome = require('../../src/assets/images/levia-nome.png');
const imgSlogan = require('../../src/assets/images/levia-slogan.png');

export default function OnboardingWelcome() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const penaCantoW = width * PENA_CANTO_LARGURA;
  const nomeW = width * NOME_LARGURA;
  const penaAW = nomeW * PENA_A_TAMANHO;
  const penaAH = penaAW / PROPORCAO_SIMBOLO;
  const sloganW = width * SLOGAN_LARGURA;

  return (
    <View style={styles.container}>
      {/* Fundo em degradê horizontal */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="fundoLevia" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={COR_DEGRADE_INICIO} />
            <Stop offset="1" stopColor={COR_DEGRADE_FIM} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#fundoLevia)" />
      </Svg>

      <SafeAreaView style={styles.safeArea}>
        {/* Pena grande no canto */}
        <Image
          source={imgSimbolo}
          style={[styles.penaCanto, { width: penaCantoW, height: penaCantoW / PROPORCAO_SIMBOLO }]}
          resizeMode="contain"
        />

        <View style={styles.content}>
          {/* Nome + pena pequena sobre o "A" */}
          <View style={{ width: nomeW, height: nomeW / PROPORCAO_NOME }}>
            <Image
              source={imgNome}
              style={{ width: nomeW, height: nomeW / PROPORCAO_NOME }}
              resizeMode="contain"
            />
            <Image
              source={imgSimbolo}
              style={{
                position: 'absolute',
                width: penaAW,
                height: penaAH,
                right: nomeW * PENA_A_DIREITA,
                top: -penaAH * PENA_A_ACIMA,
                transform: [{ rotate: PENA_A_ANGULO }],
              }}
              resizeMode="contain"
            />
          </View>

          {/* Slogan */}
          <Image
            source={imgSlogan}
            style={[styles.slogan, { width: sloganW, height: sloganW / PROPORCAO_SLOGAN }]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.footer}>
          <ThemedText variant="small" style={styles.footerText}>
            Antes de começar, vamos nos conhecer melhor — com calma, uma
            pergunta de cada vez.
          </ThemedText>
          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push('/onboarding/name')}
          >
            <ThemedText variant="subheading" color="primary">
              Vamos começar
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COR_DEGRADE_INICIO,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  penaCanto: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slogan: {
    marginTop: spacing.lg,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: colors.background,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cta: {
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    width: '100%',
    alignItems: 'center',
  },
});
