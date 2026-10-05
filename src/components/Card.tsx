import type { ViewProps } from 'react-native';

import { ThemedView } from './themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/theme';

interface CardProps extends ViewProps {
  /** Nested block inside another card — uses a lighter elevated tone instead of the base card tone. */
  elevated?: boolean;
}

export function Card({ style, elevated, ...rest }: CardProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type={elevated ? 'backgroundElevated' : 'backgroundElement'}
      style={[
        {
          borderRadius: Radius.large,
          padding: Spacing.three,
          borderWidth: 1,
          borderColor: theme.border,
        },
        style,
      ]}
      {...rest}
    />
  );
}
