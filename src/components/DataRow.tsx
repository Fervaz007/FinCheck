import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from './themed-text';
import type { ThemeColor } from '@/theme';
import { Spacing } from '@/theme';

interface DataRowProps {
  /** Dominant primary line — a name/description. */
  title: string;
  titleColor?: ThemeColor;
  /** Dominant trailing/standalone amount, already formatted (e.g. via formatCents). */
  amount?: string;
  amountColor?: ThemeColor;
  /** Small caption shown right above the amount (e.g. "Saldo pendiente"). */
  amountLabel?: string;
  /** Dimmed secondary detail (periodicity, type, due day, date, notes). A string renders as caption/textSecondary; a node renders as-is. */
  subtitle?: ReactNode;
  /** Trailing control next to the title (e.g. a delete icon). */
  action?: ReactNode;
  /** Extra nested content below (e.g. a children list, an "agregar" link, a sub-form). */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** The shared record pattern: title/amount dominant, everything else dimmed and grouped — not one run-on line. */
export function DataRow({
  title,
  titleColor,
  amount,
  amountColor,
  amountLabel,
  subtitle,
  action,
  children,
  style,
}: DataRowProps) {
  return (
    <View style={[{ gap: Spacing.one }, style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.two }}>
        <ThemedText type="heading" themeColor={titleColor} style={{ flex: 1 }}>
          {title}
        </ThemedText>
        {action}
      </View>
      {amount != null && (
        <View style={{ gap: 2 }}>
          {amountLabel != null && (
            <ThemedText type="caption" themeColor="textSecondary">
              {amountLabel}
            </ThemedText>
          )}
          <ThemedText type="amount" themeColor={amountColor}>
            {amount}
          </ThemedText>
        </View>
      )}
      {subtitle != null &&
        (typeof subtitle === 'string' ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : (
          subtitle
        ))}
      {children}
    </View>
  );
}
