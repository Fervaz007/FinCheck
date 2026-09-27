import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useAccounts } from '@/hooks/useAccounts';
import { useDebts } from '@/hooks/useDebts';
import { Spacing } from '@/theme';
import { formatCents, toCents } from '@/utils/money';

interface DebtFormValues {
  name: string;
  debtType: string;
  originalAmount: string;
  saldoPendiente: string;
  monthlyPayment: string;
  startDate: string;
}

const today = () => new Date().toISOString().slice(0, 10);

function NewDebtForm({ onSubmit }: { onSubmit: (values: DebtFormValues) => Promise<void> }) {
  const { control, handleSubmit, reset } = useForm<DebtFormValues>({
    defaultValues: {
      name: '',
      debtType: 'otro',
      originalAmount: '',
      saldoPendiente: '',
      monthlyPayment: '',
      startDate: today(),
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    reset();
  });

  return (
    <Card style={{ gap: Spacing.two }}>
      <ThemedText type="smallBold">Nueva deuda</ThemedText>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <FormField label="Nombre" value={field.value} onChangeText={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="debtType"
        render={({ field }) => (
          <FormField label="Tipo (auto, tarjeta_credito, prestamo, hipoteca...)" value={field.value} onChangeText={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="originalAmount"
        render={({ field }) => (
          <FormField label="Monto original" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="saldoPendiente"
        render={({ field }) => (
          <FormField label="Saldo pendiente" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="monthlyPayment"
        render={({ field }) => (
          <FormField label="Pago mensual" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
        )}
      />
      <Pressable onPress={submit}>
        <Card style={{ alignItems: 'center' }}>
          <ThemedText type="smallBold">Guardar deuda</ThemedText>
        </Card>
      </Pressable>
    </Card>
  );
}

export default function DeudasScreen() {
  const { debts, create, remove, confirmPayment } = useDebts();
  const { accounts } = useAccounts();
  const [showForm, setShowForm] = useState(false);

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText type="title">Deudas</ThemedText>
        <Pressable onPress={() => setShowForm((s) => !s)}>
          <ThemedText type="linkPrimary">{showForm ? 'Cancelar' : '+ Nueva'}</ThemedText>
        </Pressable>
      </View>

      {showForm && (
        <NewDebtForm
          onSubmit={async (values) => {
            await create({
              name: values.name,
              debtType: values.debtType,
              originalAmountCents: toCents(Number(values.originalAmount)),
              saldoPendienteCents: toCents(Number(values.saldoPendiente)),
              monthlyPaymentCents: toCents(Number(values.monthlyPayment)),
              startDate: values.startDate,
              status: 'activa',
            });
            setShowForm(false);
          }}
        />
      )}

      {debts.length === 0 ? (
        <EmptyState message="Sin deudas registradas." />
      ) : (
        debts.map((debt) => (
          <Card key={debt.id} style={{ gap: Spacing.two }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <ThemedText type="smallBold">{debt.name}</ThemedText>
              <Pressable
                onPress={() =>
                  Alert.alert('Eliminar deuda', `¿Eliminar "${debt.name}"? Esto no se puede deshacer.`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: () => remove(debt.id) },
                  ])
                }
              >
                <ThemedText themeColor="critical">✕</ThemedText>
              </Pressable>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Saldo pendiente: {formatCents(debt.saldoPendienteCents)} · Mensualidad:{' '}
              {formatCents(debt.monthlyPaymentCents)}
            </ThemedText>

            {debt.payments
              .filter((p) => p.status === 'scheduled')
              .map((p) => (
                <View
                  key={p.id}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <ThemedText type="small">
                    {p.occurrenceDate} · {formatCents(p.amountCents)}
                  </ThemedText>
                  <Pressable onPress={() => confirmPayment(p.id, accounts[0]?.id)}>
                    <ThemedText type="linkPrimary">Confirmar pago</ThemedText>
                  </Pressable>
                </View>
              ))}
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}
