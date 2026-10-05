import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { useDebts } from '@/hooks/useDebts';
import { useAppStore } from '@/hooks/useAppStore';
import { formatCents } from '@/utils/money';
import { Spacing } from '@/theme';
import type { HealthStatus } from '@/services/financial/health';
import type { ThemeColor } from '@/theme';

const HEALTH_LABEL: Record<HealthStatus, string> = {
  saludable: '🟢 Saludable',
  atencion: '🟡 Atención',
  riesgo: '🟠 Riesgo',
  critico: '🔴 Crítico',
  sin_limite: '⚪ Marca grupos a monitorear en tu regla',
  sin_ingreso: '⚪ Configura tus ingresos fijos',
};

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function StatRow({ label, value, color }: { label: string; value: string; color?: ThemeColor }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.one }}>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="smallBold" themeColor={color}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function DashboardScreen() {
  const { activeMonth, goToPreviousMonth, goToNextMonth } = useAppStore();
  const { summary, loading } = useDashboardSummary();
  const { upcomingReminders } = useDebts();

  return (
    <ScreenContainer>
      <View>
        <ThemedText type="title">FinCheck</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tu salud financiera, en un vistazo.
        </ThemedText>
      </View>

      {summary && (
        <Card style={{ gap: Spacing.one }}>
          <ThemedText type="caption" themeColor="textSecondary">
            DISPONIBLE
          </ThemedText>
          <ThemedText type="title" themeColor={summary.globalAvailableCents < 0 ? 'critical' : undefined}>
            {formatCents(summary.globalAvailableCents)}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Tu dinero disponible en total (todos los meses), ya restando las deudas pagadas.
          </ThemedText>
        </Card>
      )}

      {summary && (
        <Card style={{ gap: Spacing.one }}>
          <ThemedText type="caption" themeColor="textSecondary">
            INGRESOS MENSUALES
          </ThemedText>
          <ThemedText type="subtitle" themeColor="income">
            {formatCents(summary.fixedMonthlyIncomeCents)}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Lo que recibes al mes de forma fija (tus ingresos recurrentes, normalizados a mensual).
            Es la base de tu presupuesto.
          </ThemedText>
        </Card>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable hitSlop={8} onPress={goToPreviousMonth}>
          <ThemedText type="heading">◀</ThemedText>
        </Pressable>
        <ThemedText type="subtitle">
          {MONTH_NAMES[activeMonth.month - 1]} {activeMonth.year}
        </ThemedText>
        <Pressable hitSlop={8} onPress={goToNextMonth}>
          <ThemedText type="heading">▶</ThemedText>
        </Pressable>
      </View>

      {loading || !summary ? (
        <Card>
          <ThemedText>Cargando…</ThemedText>
        </Card>
      ) : (
        <>
          <Card style={{ gap: Spacing.one }}>
            <ThemedText type="caption" themeColor="textSecondary">
              RESUMEN DEL MES
            </ThemedText>
            <StatRow label="Ingresos" value={formatCents(summary.incomeTotalCents)} color="income" />
            <StatRow label="Egresos" value={formatCents(summary.expenseTotalCents)} color="expense" />
            <StatRow label="Deudas (confirmadas)" value={formatCents(summary.debtPaymentTotalCents)} color="debt" />
            <StatRow label="Balance del mes" value={formatCents(summary.availableCents)} />
          </Card>

          <Card style={{ gap: Spacing.one }}>
            <ThemedText type="caption" themeColor="textSecondary">
              SALUD FINANCIERA
            </ThemedText>
            <ThemedText type="subtitle">{HEALTH_LABEL[summary.health.status]}</ThemedText>
            {summary.health.groupStatuses.length > 0 && (
              <ThemedText type="caption" themeColor="textSecondary">
                Detalle por sección abajo, en "Por sección".
              </ThemedText>
            )}
          </Card>

          {summary.fixedMonthlyIncomeCents === 0 ? (
            <Card style={{ gap: Spacing.one }}>
              <ThemedText type="caption" themeColor="textSecondary">
                POR SECCIÓN
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Configura tus ingresos fijos (recurrentes) en Movimientos para ver tu presupuesto por
                sección.
              </ThemedText>
            </Card>
          ) : (
            summary.compliance.length > 0 && (
              <Card style={{ gap: Spacing.one }}>
                <ThemedText type="caption" themeColor="textSecondary">
                  POR SECCIÓN ({summary.compliance.length})
                </ThemedText>
                {summary.compliance.map((row) => (
                  <StatRow
                    key={row.label}
                    label={`${row.label} (${row.allocatedPct}%)`}
                    value={`${formatCents(row.actualCents)} / ${formatCents(row.allocatedCents)}`}
                    color={row.withinBudget ? 'healthy' : 'critical'}
                  />
                ))}
              </Card>
            )
          )}

          {upcomingReminders.length > 0 && (
            <Card style={{ gap: Spacing.one }}>
              <ThemedText type="caption" themeColor="textSecondary">
                PRÓXIMOS PAGOS
              </ThemedText>
              {upcomingReminders.map((r) => (
                <StatRow
                  key={r.id}
                  label={`${r.debtName} · día ${r.day}`}
                  value={formatCents(r.amountCents)}
                />
              ))}
              <ThemedText type="caption" themeColor="textSecondary">
                Solo un recordatorio — el dinero ya se descuenta solo cada quincena.
              </ThemedText>
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
