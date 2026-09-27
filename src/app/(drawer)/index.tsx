import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { useDebts } from '@/hooks/useDebts';
import { useAppStore } from '@/hooks/useAppStore';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/utils/money';
import { Spacing } from '@/theme';
import type { HealthStatus } from '@/services/financial/health';
import type { ThemeColor } from '@/theme';

const HEALTH_LABEL: Record<HealthStatus, string> = {
  saludable: '🟢 Saludable',
  atencion: '🟡 Atención',
  riesgo: '🟠 Riesgo',
  critico: '🔴 Crítico',
};

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function StatRow({ label, value, color }: { label: string; value: string; color?: ThemeColor }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.one }}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="smallBold" themeColor={color}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { activeMonth, goToPreviousMonth, goToNextMonth } = useAppStore();
  const { summary, loading } = useDashboardSummary();
  const { pendingPayments } = useDebts();

  return (
    <ScreenContainer>
      <View>
        <ThemedText type="title">FinCheck</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tu salud financiera, en un vistazo.
        </ThemedText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={goToPreviousMonth}>
          <ThemedText type="smallBold">◀</ThemedText>
        </Pressable>
        <ThemedText type="subtitle">
          {MONTH_NAMES[activeMonth.month - 1]} {activeMonth.year}
        </ThemedText>
        <Pressable onPress={goToNextMonth}>
          <ThemedText type="smallBold">▶</ThemedText>
        </Pressable>
      </View>

      {loading || !summary ? (
        <Card>
          <ThemedText>Cargando…</ThemedText>
        </Card>
      ) : (
        <>
          <Card>
            <ThemedText type="smallBold" themeColor="textSecondary">
              RESUMEN DEL MES
            </ThemedText>
            <StatRow label="Ingresos" value={formatCents(summary.incomeTotalCents)} color="income" />
            <StatRow label="Egresos" value={formatCents(summary.expenseTotalCents)} color="expense" />
            <StatRow label="Deudas (confirmadas)" value={formatCents(summary.debtPaymentTotalCents)} color="debt" />
            <StatRow label="Ahorro" value={formatCents(summary.savingsTotalCents)} color="savings" />
            <StatRow label="Disponible" value={formatCents(summary.availableCents)} />
          </Card>

          <Card>
            <ThemedText type="smallBold" themeColor="textSecondary">
              SALUD FINANCIERA
            </ThemedText>
            <ThemedText type="subtitle">{HEALTH_LABEL[summary.health.status]}</ThemedText>
            <StatRow label="Deudas / ingreso" value={`${summary.health.debtRatioPct}%`} />
            <StatRow label="Ahorro / ingreso" value={`${summary.health.savingsRatioPct}%`} />
          </Card>

          <Card>
            <ThemedText type="smallBold" themeColor="textSecondary">
              SALDO
            </ThemedText>
            <StatRow label="Saldo real" value={formatCents(summary.realBalanceCents)} />
            <StatRow label="Saldo proyectado (fin de mes)" value={formatCents(summary.projectedBalanceCents)} />
          </Card>

          {pendingPayments.length > 0 && (
            <Card style={{ borderColor: theme.critical, borderWidth: 1 }}>
              <ThemedText type="smallBold" themeColor="critical">
                PAGOS DE DEUDA PENDIENTES
              </ThemedText>
              {pendingPayments.map((p) => (
                <StatRow
                  key={p.id}
                  label={`${p.debtName} · ${p.occurrenceDate}${p.derivedStatus === 'vencido' ? ' (vencido)' : ''}`}
                  value={formatCents(p.amountCents)}
                  color={p.derivedStatus === 'vencido' ? 'critical' : undefined}
                />
              ))}
              <Link href="/deudas" asChild>
                <Pressable>
                  <ThemedText type="linkPrimary">Ir a confirmar pagos →</ThemedText>
                </Pressable>
              </Link>
            </Card>
          )}

          <Link href="/simulador" asChild>
            <Pressable>
              <Card>
                <ThemedText type="smallBold">🧮 Simular una nueva compra o deuda →</ThemedText>
              </Card>
            </Pressable>
          </Link>
        </>
      )}
    </ScreenContainer>
  );
}
