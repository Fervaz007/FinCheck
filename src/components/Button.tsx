import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, variant = 'primary', disabled, style, ...rest }: ButtonProps) {
  const theme = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? theme.primary
      : variant === 'destructive'
        ? theme.critical
        : theme.backgroundSelected;
  const textColor = variant === 'secondary' ? theme.text : '#fff';

  return (
    <Pressable
      disabled={disabled}
      style={[
        styles.base,
        { backgroundColor, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
      {...rest}
    >
      <ThemedText type="smallBold" style={{ color: textColor }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
