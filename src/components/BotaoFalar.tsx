import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet } from 'react-native';
import { Mic, Square } from 'lucide-react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { ThemedText } from '@components/ThemedText';
import { usePreferences } from '@context/PreferencesContext';
import { colors, radius, spacing } from '@constants/colors';
import { ehIOS } from '@utils/leitorWeb';

const TEMPO_MAX_SEM_RESPOSTA_MS = 10000;

interface WebResultado { results: ArrayLike<ArrayLike<{ transcript: string }>> }
interface WebReconhecimento {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: WebResultado) => void;
  onend: () => void;
  onerror: (e?: { error?: string }) => void;
  start: () => void;
  stop: () => void;
}
type WebReconhecimentoClasse = new () => WebReconhecimento;

/** Reconhecimento de voz do navegador (Chrome/Edge/Safari). Devolve undefined quando não existe. */
function webReconhecimento(): WebReconhecimentoClasse | undefined {
  const w = globalThis as unknown as { SpeechRecognition?: WebReconhecimentoClasse; webkitSpeechRecognition?: WebReconhecimentoClasse };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/**
 * Botão de microfone: transcreve a fala e preenche o campo de descrição.
 * No app instalado usa o serviço de voz do aparelho; no PWA (navegador) usa o reconhecimento do navegador.
 * O áudio não passa pelo servidor do Leviã. Só o texto transcrito segue para a análise, que tem o consentimento próprio de texto.
 */
export function BotaoFalar({ onTexto }: { onTexto: (texto: string) => void }) {
  const { t, idioma } = usePreferences();
  const [ouvindo, setOuvindo] = useState(false);
  const reconhecimentoWeb = useRef<WebReconhecimento | null>(null);

  useSpeechRecognitionEvent('result', (e) => {
    const transcricao = e.results[0]?.transcript ?? '';
    if (transcricao) onTexto(transcricao);
  });
  useSpeechRecognitionEvent('end', () => setOuvindo(false));
  useSpeechRecognitionEvent('error', () => setOuvindo(false));

  function alternarNoNavegador() {
    // No iPhone, o Leviã instalado na tela inicial não tem o reconhecimento de voz do Safari: pede o
    // microfone e não devolve nada. Nesse caso a saída é o ditado do teclado do próprio iPhone.
    const ios = ehIOS((globalThis as { navigator?: { userAgent?: string; maxTouchPoints?: number } }).navigator ?? {});
    const avisarFalha = () => Alert.alert(t(ios ? 'ref.vozTecladoIOS' : 'ref.semMicrofone'));
    const Reconhecimento = webReconhecimento();
    if (!Reconhecimento) {
      avisarFalha();
      return;
    }
    if (ouvindo) {
      reconhecimentoWeb.current?.stop();
      return;
    }
    const r = new Reconhecimento();
    let ouviu = false;
    let falhou = false;
    // sem resposta nenhuma em alguns segundos (iPhone), encerra e mostra a orientação
    const limite = setTimeout(() => { if (!ouviu) r.stop(); }, TEMPO_MAX_SEM_RESPOSTA_MS);
    r.lang = idioma;
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const transcricao = e.results[0]?.[0]?.transcript ?? '';
      if (transcricao) {
        ouviu = true;
        onTexto(transcricao);
      }
    };
    r.onend = () => {
      clearTimeout(limite);
      setOuvindo(false);
      if (ios && !ouviu && !falhou) avisarFalha();
    };
    r.onerror = (e) => {
      falhou = true;
      clearTimeout(limite);
      setOuvindo(false);
      if (e?.error !== 'aborted') avisarFalha();
    };
    reconhecimentoWeb.current = r;
    setOuvindo(true);
    try {
      r.start();
    } catch {
      clearTimeout(limite);
      setOuvindo(false);
      avisarFalha();
    }
  }

  async function alternar() {
    if (Platform.OS === 'web') return alternarNoNavegador();
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
