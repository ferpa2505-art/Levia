import { useCallback } from 'react';
import { ScrollView, View, StyleSheet, Pressable, RefreshControl, Linking } from 'react-native';
import { ThemedView } from '@components/ThemedView';
import { ThemedText } from '@components/ThemedText';
import { useNews } from '@context/NewsContext';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

function formatarData(valor: string): string {
  const data = new Date(valor);
  if (isNaN(data.getTime())) return valor;
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const hora = String(data.getHours()).padStart(2, '0');
  const min = String(data.getMinutes()).padStart(2, '0');
  return `${dia}/${mes} às ${hora}:${min}`;
}

export default function NewsScreen() {
  const { noticias, loading, atualizando, erro, atualizarNoticias } = useNews();

  const onRefresh = useCallback(() => {
    atualizarNoticias();
  }, [atualizarNoticias]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="heading" color="text">Notícias</ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
            Novidades sobre dieta, nutrição e exercícios
          </ThemedText>
        </View>

        {erro && (
          <ThemedView
            variant="surface"
            style={[styles.card, styles.cardShadow, { borderColor: colors.warning, borderWidth: 1 }]}
          >
            <ThemedText variant="small" color="textSecondary">{erro}</ThemedText>
          </ThemedView>
        )}

        {loading && noticias.length === 0 ? (
          <ThemedText variant="body" color="textSecondary">Carregando notícias...</ThemedText>
        ) : noticias.length === 0 ? (
          <ThemedText variant="body" color="textSecondary">
            Nenhuma notícia disponível no momento. Puxe a tela pra baixo pra tentar de novo.
          </ThemedText>
        ) : (
          noticias.map((item) => (
            <Pressable key={item.id} onPress={() => Linking.openURL(item.link)}>
              <ThemedView variant="surface" style={[styles.card, styles.cardShadow]}>
                <ThemedText variant="subheading" color="text">{item.titulo}</ThemedText>
                {item.resumo ? (
                  <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>
                    {item.resumo}
                  </ThemedText>
                ) : null}
                <ThemedText variant="small" color="accent" style={{ marginTop: spacing.sm }}>
                  {item.fonte} · {formatarData(item.publicadoEm)}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = estilosTema(() => ({
  container: { flex: 1 },
  header: { marginBottom: spacing['2xl'] },
  card: { padding: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.xl },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
}));
