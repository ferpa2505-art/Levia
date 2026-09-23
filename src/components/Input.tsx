import { TextInput, TextInputProps } from 'react-native';
import { colors, spacing, radius, typography } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

export function Input({ style, ...rest }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      style={[styles.input, style]}
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
