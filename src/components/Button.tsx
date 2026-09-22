import { ReactNode } from 'react';
import { Pressable, Text, View, StyleSheet, PressableProps } from 'react-native';
import { colors, spacing, radius } from '@constants/colors';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const styles = StyleSheet.create({
    base: {
      borderRadius: radius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: size === 'sm' ? spacing.sm : size === 'lg' ? spacing.lg : spacing.md,
      paddingHorizontal: spacing.lg,
    },
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.accent,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
    },
  });

  const textColor =
    variant === 'outline' ? colors.primary : colors.background;

  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        styles.base,
        styles[variant],
        { opacity: disabled ? 0.5 : state.pressed ? 0.7 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon ? <View style={{ marginRight: spacing.xs }}>{icon}</View> : null}
        <Text
          style={{
            color: textColor,
            fontWeight: '600',
            fontSize: 16,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
