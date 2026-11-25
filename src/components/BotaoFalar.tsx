import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { ThemedText } from '@components/ThemedText';
import { usePreferences } from '@context/PreferencesContext';
import { colors, radius, spacing } from '@constants/colors';

/**
 * Botão de microfone: transcreve a fala e preenche o campo de descrição.
 * O reconhecimento usa o serviço de voz do próprio aparelho; o áudio não passa pelo servidor do Leviã.
 * Só o texto transcrito segue para a análise, que tem o consentimento próprio de texto.
 */
export function BotaoFalar({ onTexto }: { onTexto: (texto: string) => void }) {
  const { t, idioma } = usePreferences();
  const [ouvindo, setOuvindo] = useState(false);

  useSpeechRecognitionEvent('result', (e) => {
    const transcricao = e.results[0]?.transcript ?? '';
    if (transcricao) onTexto(transcricao);
  });
  useSpeechRecognitionEvent('end', () => setOuvindo(false));
  useSpeechRecognitionEvent('error', () => setOuvindo(false));

  async function alternar() {
    if (ouvindo) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const permissao = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(t('ref.semMicrofone'));
      return;
    }
    setOuvindo(true);
    ExpoSpeechRecognitionModule.start({ lang: idioma, interimResults: true, continuous: false });
  }

  return (
    <Pressable
      onPress={alternar}
      accessibilityRole="button"
      accessibilityLabel={ouvindo ? t('ref.textoOuvindo') : t('ref.textoFalar')}
      style={[styles.botao, ouvindo && styles.botaoAtivo]}
    >
      {ouvindo ? <Square size={16} color={colors.background} strokeWidth={2.5} /> : <Mic size={18} color={colors.primary} strokeWidth={2} />}
      <ThemedText variant="small" color={ouvindo ? 'background' : 'primary'} style={{ marginLeft: spacing.xs }}>
        {ouvindo ? t('ref.textoOuvindo') : t('ref.textoFalar')}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  botaoAtivo: { backgroundColor: colors.primary },
});
