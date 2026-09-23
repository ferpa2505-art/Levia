import { useState } from 'react';
import { View, Pressable, Image, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { ThemedText } from '@components/ThemedText';
import { ListaIdiomas } from '@components/ListaIdiomas';
import { usePreferences } from '@context/PreferencesContext';
import { CodigoIdioma } from '@/i18n';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

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

/** Fundo em degradê horizontal usado nas duas etapas desta tela */
function FundoDegrade() {
  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
      <Defs>
        <LinearGradient id="fundoLevia" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={COR_DEGRADE_INICIO} />
          <Stop offset="1" stopColor={COR_DEGRADE_FIM} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#fundoLevia)" />
    </Svg>
  );
}

export default function OnboardingWelcome() {
  const { idiomaConfirmado } = usePreferences();

  // 1ª etapa: escolher o idioma. 2ª etapa: boas-vindas.
  return idiomaConfirmado ? <BoasVindas /> : <EscolhaDeIdioma />;
}

/* ---------------- ETAPA 1 — ESCOLHA DE IDIOMA ---------------- */

function EscolhaDeIdioma() {
  const { idioma, mudarIdioma, confirmarIdioma, t } = usePreferences();
  const [selecionado, setSelecionado] = useState<CodigoIdioma>(idioma);
  const { width } = useWindowDimensions();
  const penaW = width * 0.14;

  function selecionar(codigo: CodigoIdioma) {
    setSelecionado(codigo);
    mudarIdioma(codigo); // os textos da tela já mudam para o idioma escolhido
  }

  return (
    <View style={styles.container}>
      <FundoDegrade />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.idiomaTopo}>
          <Image
            source={imgSimbolo}
            style={{ width: penaW, height: penaW / PROPORCAO_SIMBOLO }}
            resizeMode="contain"
          />
          <ThemedText variant="heading" style={styles.idiomaTitulo}>
            {t('idioma.titulo')}
          </ThemedText>
          <ThemedText variant="small" style={styles.idiomaSubtitulo}>
            {t('idioma.subtitulo')}
          </ThemedText>
        </View>

        <ScrollView style={styles.idiomaLista} contentContainerStyle={{ paddingBottom: spacing.lg }}>
          <ListaIdiomas selecionado={selecionado} onSelecionar={selecionar} aparencia="claro" />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => confirmarIdioma(selecionado)}
          >
            <ThemedText variant="subheading" style={styles.ctaTexto}>
              {t('comum.continuar')}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ---------------- ETAPA 2 — BOAS-VINDAS ---------------- */

function BoasVindas() {
  const router = useRouter();
  const { idioma, t } = usePreferences();
  const { width } = useWindowDimensions();

  const penaCantoW = width * PENA_CANTO_LARGURA;
  const nomeW = width * NOME_LARGURA;
  const penaAW = nomeW * PENA_A_TAMANHO;
  const penaAH = penaAW / PROPORCAO_SIMBOLO;
  const sloganW = width * SLOGAN_LARGURA;

  // A imagem do slogan está em português; nos outros idiomas mostramos o texto traduzido
  const sloganEmImagem = idioma === 'pt-BR' || idioma === 'pt-PT';

  return (
    <View style={styles.container}>
      <FundoDegrade />

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
          {sloganEmImagem ? (
            <Image
              source={imgSlogan}
              style={[styles.slogan, { width: sloganW, height: sloganW / PROPORCAO_SLOGAN }]}
              resizeMode="contain"
            />
          ) : (
            <ThemedText style={[styles.slogan, styles.sloganTexto]}>
              {t('boasVindas.slogan')}
            </ThemedText>
          )}
        </View>

        <View style={styles.footer}>
          <ThemedText variant="small" style={styles.footerText}>
            {t('boasVindas.intro')}
          </ThemedText>
          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push('/onboarding/name')}
          >
            <ThemedText variant="subheading" style={styles.ctaTexto}>
              {t('boasVindas.comecar')}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = estilosTema(() => ({
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
  sloganTexto: {
    color: '#FBF8F3',
    fontSize: 26,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: undefined }),
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: '#FBF8F3',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  cta: {
    backgroundColor: '#FBF8F3',
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    width: '100%',
    alignItems: 'center',
  },
  ctaTexto: {
    color: COR_DEGRADE_INICIO,
  },
  idiomaTopo: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  idiomaTitulo: {
    color: '#FBF8F3',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  idiomaSubtitulo: {
    color: '#FBF8F3',
    opacity: 0.85,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  idiomaLista: {
    flex: 1,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
}));
