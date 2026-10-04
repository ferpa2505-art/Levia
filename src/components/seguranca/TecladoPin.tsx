import { View, Pressable } from 'react-native';
import { Delete, Fingerprint, ScanFace } from 'lucide-react-native';
import { ThemedText } from '@components/ThemedText';
import { colors, spacing } from '@constants/colors';
import { estilosTema } from '@theme/estilos';
import { PIN_MAX } from '@utils/seguranca';
import type { TipoBiometria } from '@utils/seguranca';

interface Props {
  valor: string;
  onChange: (valor: string) => void;
  /** Quantas bolinhas mostrar (no desbloqueio: o tamanho da senha) */
  bolinhas?: number;
  erro?: boolean;
  /** Mostra o botão de biometria no canto do teclado */
  biometria?: TipoBiometria;
  onBiometria?: () => void;
  desabilitado?: boolean;
}

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'apagar'];

/** Teclado numérico na tela, com as bolinhas da senha */
export function TecladoPin({ valor, onChange, bolinhas, erro, biometria, onBiometria, desabilitado }: Props) {
  const total = bolinhas ?? Math.max(4, valor.length);

  function tocar(tecla: string) {
    if (desabilitado) return;
    if (tecla === 'apagar') onChange(valor.slice(0, -1));
    else if (tecla === 'bio') onBiometria?.();
    else if (valor.length < (bolinhas ?? PIN_MAX)) {
      onChange(valor + tecla);
    }
  }

  const IconeBio = biometria === 'rosto' ? ScanFace : Fingerprint;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.bolinhas}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[styles.bolinha, i < valor.length && styles.bolinhaCheia, erro && styles.bolinhaErro]}
          />
        ))}
      </View>
      <View style={styles.grade}>
        {TECLAS.map((tecla) => {
          if (tecla === 'bio' && (!biometria || !onBiometria)) return <View key={tecla} style={styles.tecla} />;
          return (
            <Pressable
              key={tecla}
              onPress={() => tocar(tecla)}
              disabled={desabilitado}
              style={({ pressed }) => [styles.tecla, tecla.length === 1 && styles.teclaNumero, pressed && styles.teclaPressionada, desabilitado && { opacity: 0.4 }]}
              accessibilityLabel={tecla === 'apagar' ? 'apagar' : tecla === 'bio' ? 'biometria' : tecla}
            >
              {tecla === 'apagar' ? (
                <Delete size={26} color={colors.text} strokeWidth={1.8} />
              ) : tecla === 'bio' ? (
                <IconeBio size={30} color={colors.primary} strokeWidth={1.8} />
              ) : (
                <ThemedText variant="title" color="text">{tecla}</ThemedText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const TAM = 76;
const styles = estilosTema(() => ({
  bolinhas: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing['2xl'], minHeight: 18 },
  bolinha: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.primary },
  bolinhaCheia: { backgroundColor: colors.primary },
  bolinhaErro: { borderColor: colors.error, backgroundColor: colors.error },
  grade: { flexDirection: 'row', flexWrap: 'wrap', width: TAM * 3 + spacing.xl * 2, gap: spacing.xl, justifyContent: 'center' },
  tecla: { width: TAM, height: TAM, borderRadius: TAM / 2, alignItems: 'center', justifyContent: 'center' },
  teclaNumero: { backgroundColor: colors.primarySoft },
  teclaPressionada: { opacity: 0.6, transform: [{ scale: 0.96 }] },
}));
