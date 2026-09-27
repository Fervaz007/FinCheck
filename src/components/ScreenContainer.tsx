import type { PropsWithChildren } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from './themed-view';
import { Spacing } from '@/theme';

export function ScreenContainer({
  children,
  contentContainerStyle,
  ...rest
}: PropsWithChildren<ScrollViewProps>) {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
            contentContainerStyle,
          ]}
          {...rest}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
