import { Pressable } from 'react-native';
import { ThemedText } from '@components/ThemedText';
import { colors, spacing, radius } from '@constants/colors';
import { estilosTema } from '@theme/estilos';

interface OptionPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionPill({ label, selected, onPress }: OptionPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected && styles.pillSelected]}
    >
      <ThemedText variant="subheading" color={selected ? 'background' : 'text'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = estilosTema(() => ({
  pill: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
}));
