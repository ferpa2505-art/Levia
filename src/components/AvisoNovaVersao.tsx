import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { ThemedText } from '@components/ThemedText';
import { Button } from '@components/Button';
import { useT } from '@context/PreferencesContext';
import { colors, radius, spacing } from '@constants/colors';
import { useNovaVersaoWeb } from '@hooks/useNovaVersaoWeb';
import { estilosTema } from '@theme/estilos';

/** Faixa no rodapé quando saiu versão nova do app instalado pelo navegador: "Atualizar" recarrega. */
export function AvisoNovaVersao({ ativo }: { ativo: boolean }) {
  const t = useT();
  const disponivel = useNovaVersaoWeb(ativo);
  const [dispensado, setDispensado] = useState(false);

  if (Platform.OS !== 'web' || !disponivel || dispensado) return null;

  return (
    <View style={styles.faixa} accessibilityRole="alert">
      <View style={{ flex: 1 }}>
        <ThemedText variant="small" color="text" style={{ fontWeight: '600' }}>{t('atu.webTitulo')}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">{t('atu.webMsg')}</ThemedText>
      </View>
      <Button label={t('atu.webBotao')} size="sm" onPress={() => { (globalThis as any).location?.reload?.(); }} style={{ marginLeft: spacing.sm }} />
      <Pressable onPress={() => setDispensado(true)} accessibilityRole="button" accessibilityLabel={t('atu.depois')} hitSlop={10} style={{ marginLeft: spacing.sm }}>
        <ThemedText variant="body" color="textSecondary">✕</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = estilosTema(() => ({
  faixa: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg + 56,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    zIndex: 50,
    elevation: 6,
  },
}));
