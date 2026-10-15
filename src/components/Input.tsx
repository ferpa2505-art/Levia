import { DeviceEventEmitter, TextInput, TextInputProps } from 'react-native';
import { colors, spacing, radius, typography } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

export function Input({ style, onFocus, ...rest }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      style={[styles.input, style]}
      onFocus={(e) => {
        // a TelaRolavel rola até este campo se o teclado estiver por cima
        DeviceEventEmitter.emit('levia:inputFocado');
        onFocus?.(e);
      }}
      {...rest}
    />
  );
}

const styles = estilosTema(() => ({
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.size.xl,
    color: colors.text,
    textAlign: 'center',
  },
}));
