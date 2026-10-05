import { Card } from '@/components/Card';
import { DataRow } from '@/components/DataRow';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useDebtReserves } from '@/hooks/useDebtReserves';
import { formatCents } from '@/utils/money';

const PERIODICITY_LABEL: Record<string, string> = {
  mensual: 'Mensual (2 quincenas)',
  bimestral: 'Bimestral (4 quincenas)',
};

export default function ApartadosScreen() {
  const { debts, loading } = useDebtReserves();

  return (
    <ScreenContainer>
      <ThemedText type="title">Apartados</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Cada quincena se descuenta automáticamente una parte de tus deudas recurrentes de tu dinero
        disponible. Aquí ves cuánto llevas descontado de cada una.
      </ThemedText>

      {loading ? null : debts.length === 0 ? (
        <EmptyState message="Sin deudas recurrentes todavía." />
      ) : (
        debts.map((debt) => (
          <Card key={debt.id}>
            <DataRow
              title={debt.name}
              subtitle={`${debt.periodicity ? PERIODICITY_LABEL[debt.periodicity] : ''} · ${formatCents(debt.perCutoffCents)} c/quincena`}
              amountLabel="Descontado hasta hoy"
              amount={formatCents(debt.committedCents)}
              amountColor="debt"
            />
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}
