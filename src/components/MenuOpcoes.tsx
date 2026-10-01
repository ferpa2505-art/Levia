import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { MoreVertical, Palette, Globe, ChevronRight, ChevronLeft, Check, ShieldCheck, ExternalLink } from 'lucide-react-native';
import { ThemedText } from '@components/ThemedText';
import { ListaIdiomas } from '@components/ListaIdiomas';
import { usePreferences } from '@context/PreferencesContext';
import { IDIOMAS } from '@/i18n';
import { colors, spacing, radius, NomeTema } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

const URL_PRIVACIDADE = 'https://ferpa2505-art.github.io/levia-policies/privacidade.html';

type Tela = 'principal' | 'tema' | 'idioma';

// Cores de amostra de cada tema (bolinha ao lado do nome)
const AMOSTRAS: Record<NomeTema, string> = {
  salvia: '#6FA58E',
  petroleo: '#0A6E80',
};

/** Botão ⋮ do cabeçalho, com as opções de Tema e Idioma. */
export function MenuOpcoes() {
  const { tema, idioma, mudarTema, mudarIdioma, t } = usePreferences();
  const [aberto, setAberto] = useState(false);
  const [tela, setTela] = useState<Tela>('principal');
  const { height } = useWindowDimensions();

  const nomeIdiomaAtual = IDIOMAS.find((i) => i.codigo === idioma)?.nome ?? idioma;

  function abrir() {
    setTela('principal');
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
  }

  function escolherTema(novo: NomeTema) {
    setAberto(false);
    if (novo !== tema) {
      // pequena espera para o menu fechar antes de redesenhar o app com as cores novas
      setTimeout(() => mudarTema(novo), 150);
    }
  }

  return (
    <>
      <Pressable
        onPress={abrir}
        hitSlop={12}
        style={({ pressed }) => [styles.botao, { opacity: pressed ? 0.5 : 1 }]}
        accessibilityLabel={t('menu.titulo')}
      >
        <MoreVertical size={24} color={colors.text} strokeWidth={2} />
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={fechar}>
        <Pressable style={styles.fundo} onPress={fechar}>
          <Pressable style={[styles.caixa, { maxHeight: height * 0.75 }]} onPress={() => {}}>
            {tela === 'principal' && (
              <>
                <ThemedText variant="subheading" color="text" style={styles.titulo}>
                  {t('menu.titulo')}
                </ThemedText>

                <Pressable style={styles.item} onPress={() => setTela('tema')}>
                  <Palette size={20} color={colors.primary} strokeWidth={2} />
                  <View style={styles.itemTextos}>
                    <ThemedText variant="body" color="text">{t('menu.tema')}</ThemedText>
                    <ThemedText variant="small" color="textSecondary">
                      {t(tema === 'salvia' ? 'tema.salvia' : 'tema.petroleo')}
                    </ThemedText>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>

                <Pressable style={styles.item} onPress={() => setTela('idioma')}>
                  <Globe size={20} color={colors.primary} strokeWidth={2} />
                  <View style={styles.itemTextos}>
                    <ThemedText variant="body" color="text">{t('menu.idioma')}</ThemedText>
                    <ThemedText variant="small" color="textSecondary">{nomeIdiomaAtual}</ThemedText>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>

                <Pressable style={styles.item} onPress={() => Linking.openURL(URL_PRIVACIDADE)}>
                  <ShieldCheck size={20} color={colors.primary} strokeWidth={2} />
                  <View style={styles.itemTextos}>
                    <ThemedText variant="body" color="text">{t('menu.privacidade')}</ThemedText>
                  </View>
                  <ExternalLink size={18} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
              </>
            )}

            {tela === 'tema' && (
              <>
                <Pressable style={styles.voltar} onPress={() => setTela('principal')}>
                  <ChevronLeft size={20} color={colors.text} strokeWidth={2} />
                  <ThemedText variant="subheading" color="text">{t('menu.tema')}</ThemedText>
                </Pressable>

                {(['salvia', 'petroleo'] as NomeTema[]).map((opcao) => (
                  <Pressable
                    key={opcao}
                    style={[styles.item, opcao === tema && styles.itemAtivo]}
                    onPress={() => escolherTema(opcao)}
                  >
                    <View style={[styles.amostra, { backgroundColor: AMOSTRAS[opcao] }]} />
                    <View style={styles.itemTextos}>
                      <ThemedText variant="body" color="text">
                        {t(opcao === 'salvia' ? 'tema.salvia' : 'tema.petroleo')}
                      </ThemedText>
                    </View>
                    {opcao === tema ? (
                      <Check size={20} color={colors.primary} strokeWidth={2.5} />
                    ) : null}
                  </Pressable>
                ))}
              </>
            )}

            {tela === 'idioma' && (
              <>
                <Pressable style={styles.voltar} onPress={() => setTela('principal')}>
                  <ChevronLeft size={20} color={colors.text} strokeWidth={2} />
                  <ThemedText variant="subheading" color="text">{t('menu.idioma')}</ThemedText>
                </Pressable>
                <ScrollView style={{ maxHeight: height * 0.6 }}>
                  <ListaIdiomas
                    selecionado={idioma}
                    onSelecionar={(codigo) => {
                      mudarIdioma(codigo);
                      setAberto(false);
                    }}
                  />
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = estilosTema(() => ({
  botao: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingHorizontal: spacing.md,
  },
  caixa: {
    width: '85%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  titulo: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  itemAtivo: {
    backgroundColor: colors.primarySoft,
  },
  itemTextos: {
    flex: 1,
    marginLeft: spacing.md,
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  amostra: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
}));
