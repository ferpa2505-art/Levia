import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, Syringe, Droplet, Pill, UserRound } from 'lucide-react-native';
import { TelaRolavel } from '@components/TelaRolavel';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { ListaMedicacoes } from '@components/ListaMedicacoes';
import { SecaoGlp1 } from '@components/saude/SecaoGlp1';
import { SecaoDiabetes } from '@components/saude/SecaoDiabetes';
import { SecaoPerfil } from '@components/saude/SecaoPerfil';
import { colors, spacing, radius } from '@constants/colors';
import { useT } from '@context/PreferencesContext';
import type { ChaveTraducao } from '@/i18n/traducoes/pt-BR';

/** Seções internas do módulo Saúde. 'visao' é o painel com os cartões. */
type SecaoAtiva = 'visao' | 'glp1' | 'diabetes' | 'medicacoes' | 'perfil';

type Cartao = {
  id: Exclude<SecaoAtiva, 'visao'>;
  chave: ChaveTraducao;
  icone: typeof Syringe;
};

const CARTOES: Cartao[] = [
  { id: 'glp1', chave: 'titulos.glp1', icone: Syringe },
  { id: 'diabetes', chave: 'titulos.diabetes', icone: Droplet },
  { id: 'medicacoes', chave: 'med.tituloTela', icone: Pill },
  { id: 'perfil', chave: 'saude.perfilPeso', icone: UserRound },
];

export default function SaudeScreen() {
  const t = useT();
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoAtiva>('visao');

  if (secaoAtiva === 'visao') {
    return (
      <TelaRolavel>
        <ThemedView style={styles.container}>
          {CARTOES.map((cartao) => {
            const Icone = cartao.icone;
            return (
              <Pressable
                key={cartao.id}
                onPress={() => setSecaoAtiva(cartao.id)}
                accessibilityRole="button"
                accessibilityLabel={t(cartao.chave)}
              >
                <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
                  <View style={styles.iconeCirculo}>
                    <Icone size={20} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.cardTexto}>
                    <ThemedText variant="subheading" color="text">
                      {t(cartao.chave)}
                    </ThemedText>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
                </ThemedView>
              </Pressable>
            );
          })}
        </ThemedView>
      </TelaRolavel>
    );
  }

  return (
    <View style={styles.raiz}>
      <Pressable
        onPress={() => setSecaoAtiva('visao')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('comum.voltarTexto')}
        style={styles.voltar}
      >
        <ChevronLeft size={20} color={colors.primary} strokeWidth={2} />
        <ThemedText variant="subheading" color="primary" style={{ marginLeft: spacing.xs }}>
          {t('comum.voltarTexto')}
        </ThemedText>
      </Pressable>

      <View style={styles.conteudo}>
        {secaoAtiva === 'glp1' && <SecaoGlp1 />}
        {secaoAtiva === 'diabetes' && <SecaoDiabetes />}
        {secaoAtiva === 'medicacoes' && (
          <TelaRolavel>
            <ListaMedicacoes />
          </TelaRolavel>
        )}
        {secaoAtiva === 'perfil' && <SecaoPerfil />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconeCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTexto: {
    flex: 1,
    marginLeft: spacing.md,
  },
  raiz: {
    flex: 1,
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  conteudo: {
    flex: 1,
  },
});
