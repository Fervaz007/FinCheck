import type { ViewProps } from 'react-native';

import { ThemedView } from './themed-view';
import { Radius, Spacing } from '@/theme';

export function Card({ style, ...rest }: ViewProps) {
  return (
    <ThemedView
      type="backgroundElement"
      style={[{ borderRadius: Radius.medium, padding: Spacing.three }, style]}
      {...rest}
    />
  );
}
