import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { useT } from '@context/PreferencesContext';
import { colors, radius, spacing } from '@constants/colors';
import { aoMudarLicenca, lerLicenca, Licenca } from '@utils/licenca';
import { conviteDispensadoHoje, estadoDoTeste } from '@utils/teste';
import { dataDeHoje } from '@utils/recordsStorage';
import { estilosTema } from '@theme/estilos';

const CHAVE_DISPENSA = 'levia:conviteTesteDispensadoEm';

/**
 * Aviso do teste grátis na tela inicial. Nunca bloqueia nada:
 * - até 4 dias antes do fim: uma linha discreta ("Faltam X dias") com o atalho "Ver planos";
 * - nos últimos 3 dias: um convite mais forte, que a pessoa pode dispensar (volta no dia seguinte);
 * - depois do vencimento: o convite fica fixo, sem dispensar.
 */
export function FaixaTeste() {
  const t = useT();
  const router = useRouter();
  const [licenca, setLicenca] = useState<Licenca | null>(null);
  const [dispensadoEm, setDispensadoEm] = useState<string | null>(null);

  const carregar = useCallback(() => {
    lerLicenca().then(setLicenca).catch(() => setLicenca(null));
  }, []);

  useEffect(() => {
    carregar();
    AsyncStorage.getItem(CHAVE_DISPENSA).then(setDispensadoEm).catch(() => {});
    return aoMudarLicenca(carregar);
  }, [carregar]);

  const { estado, dias } = estadoDoTeste(licenca);
  if (estado === 'nenhum') return null;

  const abrirPlanos = () => { router.push('/planos'); };
  const dispensar = () => {
    const hoje = dataDeHoje();
    setDispensadoEm(hoje);
    AsyncStorage.setItem(CHAVE_DISPENSA, hoje).catch(() => {});
  };

  const titulo =
    estado === 'vencido' ? t('teste.terminou')
      : estado === 'ultimoDia' ? t('teste.ultimoDia')
        : dias === 1 ? t('teste.restamUm')
          : t('teste.restam', { dias });

  const forte = estado === 'vencido' || (estado !== 'normal' && !conviteDispensadoHoje(dispensadoEm, dataDeHoje()));

  if (!forte) {
    return (
      <View style={styles.linha}>
        <ThemedText variant="small" color="textSecondary" style={{ flex: 1 }}>{titulo}</ThemedText>
        <Pressable onPress={abrirPlanos} accessibilityRole="link" accessibilityLabel={t('teste.verPlanos')} hitSlop={8}>
          <ThemedText variant="small" color="primary" style={styles.link}>{t('teste.verPlanos')}</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.cartao}>
      <View style={styles.topo}>
        <ThemedText variant="subheading" color="text" style={{ flex: 1 }}>{titulo}</ThemedText>
        {estado !== 'vencido' && (
          <Pressable onPress={dispensar} accessibilityRole="button" accessibilityLabel={t('teste.dispensar')} hitSlop={10}>
            <ThemedText variant="body" color="textSecondary">✕</ThemedText>
          </Pressable>
        )}
      </View>
      <ThemedText variant="small" color="textSecondary" style={{ marginTop: spacing.xs }}>
        {estado === 'vencido' ? t('teste.conviteFim') : t('teste.convite')}
      </ThemedText>
      <Button label={t('teste.verPlanos')} size="sm" onPress={abrirPlanos} style={{ marginTop: spacing.md }} />
    </View>
  );
}

const styles = estilosTema(() => ({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  link: { fontWeight: '600', textDecorationLine: 'underline' },
  cartao: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topo: { flexDirection: 'row', alignItems: 'flex-start' },
}));
