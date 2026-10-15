import { View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { ThemedText } from '@components/ThemedText';
import { colors, spacing } from '@constants/colors';

/** Aviso em vermelho logo abaixo do campo (some quando `texto` é vazio) */
export function MensagemErro({ texto }: { texto?: string | null }) {
  if (!texto) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
      <AlertCircle size={14} color={colors.error} strokeWidth={2} />
      <ThemedText variant="caption" color="error" style={{ marginLeft: 4, flex: 1 }}>{texto}</ThemedText>
    </View>
  );
}
