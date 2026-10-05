import { View } from 'react-native';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useMonthlyHistory } from '@/hooks/useMonthlyHistory';
import { Spacing } from '@/theme';
import { formatCents } from '@/utils/money';

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export default function HistorialScreen() {
  const { summaries, loading } = useMonthlyHistory();

  return (
    <ScreenContainer>
      <ThemedText type="title">Historial mensual</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Cada mes conserva la regla de presupuesto y el límite de deuda que estaban vigentes cuando se calculó.
      </ThemedText>

      {loading ? (
        <ThemedText>Cargando…</ThemedText>
      ) : summaries.length === 0 ? (
        <EmptyState message="Todavía no hay meses cerrados. El historial se genera automáticamente al usar el Dashboard." />
      ) : (
        summaries.map((s) => (
          <Card key={`${s.year}-${s.month}`} style={{ gap: Spacing.two }}>
            <ThemedText type="heading">
              {MONTH_NAMES[s.month - 1]} {s.year}
            </ThemedText>
            <View style={{ gap: Spacing.one }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText type="small" themeColor="textSecondary">Ingresos</ThemedText>
                <ThemedText type="smallBold" themeColor="income">{formatCents(s.incomeTotalCents)}</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText type="small" themeColor="textSecondary">Egresos</ThemedText>
                <ThemedText type="smallBold" themeColor="expense">{formatCents(s.expenseTotalCents)}</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText type="small" themeColor="textSecondary">Deudas</ThemedText>
                <ThemedText type="smallBold" themeColor="debt">{formatCents(s.debtPaymentTotalCents)}</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText type="small" themeColor="textSecondary">Ahorro</ThemedText>
                <ThemedText type="smallBold" themeColor="savings">{formatCents(s.savingsTotalCents)}</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText type="small" themeColor="textSecondary">Disponible</ThemedText>
                <ThemedText type="smallBold">{formatCents(s.availableCents)}</ThemedText>
              </View>
            </View>
            {s.healthStatusSnapshot && (
              <ThemedText type="caption" themeColor="textSecondary">
                Salud registrada: {s.healthStatusSnapshot} · Límite de deuda vigente: {s.debtLimitPctSnapshot}%
              </ThemedText>
            )}
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}
