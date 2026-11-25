import { useRef, useState } from 'react';
import { Modal, Platform, View, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ThemedText } from '@components/ThemedText';
import { ThemedView } from '@components/ThemedView';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { usePreferences } from '@context/PreferencesContext';
import { colors, spacing, radius } from '@constants/colors';

const TIPOS_LIDOS = ['ean13', 'ean8', 'upc_a'] as const;

/**
 * Leitor de código de barras em janela. No celular usa a câmera; na web (PWA) e sem permissão,
 * mostra só o campo para digitar o código. Entrega o código uma única vez por abertura.
 */
export function LeitorCodigoBarras({
  visivel,
  onLer,
  onFechar,
}: {
  visivel: boolean;
  onLer: (codigo: string) => void;
  onFechar: () => void;
}) {
  const { t } = usePreferences();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [digitado, setDigitado] = useState('');
  const jaLeu = useRef(false);
  const usaCamera = Platform.OS !== 'web';

  function entregar(codigo: string) {
    if (jaLeu.current) return;
    jaLeu.current = true;
    onLer(codigo);
  }

  function aoFechar() {
    jaLeu.current = false;
    setDigitado('');
    onFechar();
  }

  return (
    <Modal visible={visivel} animationType="slide" onRequestClose={aoFechar}>
      <ThemedView style={styles.container}>
        <ThemedText variant="heading">{t('ref.codigo.titulo')}</ThemedText>

        {usaCamera && permissao?.granted ? (
          <View style={styles.camera}>
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: [...TIPOS_LIDOS] }}
              onBarcodeScanned={({ data }) => entregar(data)}
            />
          </View>
        ) : usaCamera ? (
          <View style={styles.bloco}>
            <ThemedText variant="small" color="textSecondary">{t('ref.codigo.semPermissao')}</ThemedText>
            <Button label={t('ref.codigo.permitir')} onPress={() => pedirPermissao()} />
          </View>
        ) : null}

        <View style={styles.bloco}>
          <ThemedText variant="small" color="textSecondary">{t('ref.codigo.digitar')}</ThemedText>
          <Input
            value={digitado}
            onChangeText={setDigitado}
            keyboardType="number-pad"
            placeholder="7790070336965"
          />
          <Button label={t('ref.codigo.buscar')} disabled={!digitado.trim()} onPress={() => entregar(digitado)} />
        </View>

        <Pressable onPress={aoFechar} hitSlop={8} style={styles.fechar}>
          <ThemedText variant="small" color="primary">{t('ref.codigo.fechar')}</ThemedText>
        </Pressable>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  camera: { flex: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.border, minHeight: 240 },
  bloco: { gap: spacing.sm },
  fechar: { alignSelf: 'center', padding: spacing.sm },
});
