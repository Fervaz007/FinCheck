import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/theme';

export interface ChipOption<T extends string | number> {
  label: string;
  value: T;
}

interface ChipSelectProps<T extends string | number> {
  label: string;
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

export function ChipSelect<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: ChipSelectProps<T>) {
  const theme = useTheme();

  return (
    <ThemedView style={{ gap: Spacing.one }}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onChange(option.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? theme.primary : theme.backgroundSelected,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText type="small" style={{ color: selected ? '#fff' : theme.text }}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
