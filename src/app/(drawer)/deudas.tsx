import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { Card } from '@/components/Card';
import { ChipSelect } from '@/components/ChipSelect';
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
  remainingPayments: string;
  paymentDay: string;
  accountId: number | null;
  startDate: string;
}

interface ChildDebtFormValues {
  name: string;
  monthlyPayment: string;
  isIndefinite: 'si' | 'no';
  remainingPayments: string;
}

const today = () => new Date().toISOString().slice(0, 10);

function NewDebtForm({ onSubmit }: { onSubmit: (values: DebtFormValues) => Promise<void> }) {
  const { accounts } = useAccounts();
  const { control, handleSubmit, reset } = useForm<DebtFormValues>({
    defaultValues: {
      name: '',
      debtType: 'otro',
      originalAmount: '',
      saldoPendiente: '',
      monthlyPayment: '',
      remainingPayments: '',
      paymentDay: '',
      accountId: null,
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
      <ThemedText type="small" themeColor="textSecondary">
        Si es una tarjeta de crédito con varias cositas adentro (MSI, suscripciones), regístrala
        aquí primero y luego agrégale "hijas" desde su tarjeta.
      </ThemedText>
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
      <Controller
        control={control}
        name="remainingPayments"
        render={({ field }) => (
          <FormField
            label="Pagos restantes (meses)"
            keyboardType="number-pad"
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      <ThemedText type="smallBold" themeColor="textSecondary">
        Pago automático mensual (opcional, recomendado)
      </ThemedText>
      <Controller
        control={control}
        name="paymentDay"
        render={({ field }) => (
          <FormField
            label="Día de pago (1-31)"
            keyboardType="number-pad"
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="accountId"
        render={({ field }) => (
          <ChipSelect
            label="Cuenta de la que se paga"
            value={field.value}
            onChange={field.onChange}
            options={accounts.map((a) => ({ label: a.name, value: a.id }))}
          />
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

function NewChildDebtForm({ onSubmit }: { onSubmit: (values: ChildDebtFormValues) => Promise<void> }) {
  const { control, handleSubmit, watch, reset } = useForm<ChildDebtFormValues>({
    defaultValues: { name: '', monthlyPayment: '', isIndefinite: 'no', remainingPayments: '' },
  });
  const isIndefinite = watch('isIndefinite') === 'si';

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    reset();
  });

  return (
    <Card style={{ gap: Spacing.two, marginLeft: Spacing.four }}>
      <ThemedText type="smallBold">Nueva hija</ThemedText>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <FormField label="Nombre" placeholder="Llantas, TV, Netflix..." value={field.value} onChangeText={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="monthlyPayment"
        render={({ field }) => (
          <FormField label="Pago mensual" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="isIndefinite"
        render={({ field }) => (
          <ChipSelect
            label="¿Se termina algún día?"
            value={field.value}
            onChange={field.onChange}
            options={[
              { label: 'Sí, tiene meses contados (MSI)', value: 'no' },
              { label: 'No, es indefinida (suscripción)', value: 'si' },
            ]}
          />
        )}
      />
      {!isIndefinite && (
        <Controller
          control={control}
          name="remainingPayments"
          render={({ field }) => (
            <FormField
              label="Meses restantes"
              keyboardType="number-pad"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
      )}
      <Pressable onPress={submit}>
        <Card style={{ alignItems: 'center' }}>
          <ThemedText type="smallBold">Guardar hija</ThemedText>
        </Card>
      </Pressable>
    </Card>
  );
}

export default function DeudasScreen() {
  const { debts, create, createChild, remove, confirmPayment } = useDebts();
  const { accounts } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [childFormForDebtId, setChildFormForDebtId] = useState<number | null>(null);

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
            const paymentDay = Number(values.paymentDay);
            const hasAutoPayment = paymentDay >= 1 && paymentDay <= 31 && values.accountId != null;

            if (values.paymentDay.trim() && !hasAutoPayment) {
              Alert.alert(
                'Falta la cuenta',
                'Si quieres pago automático, elige también de qué cuenta sale (o deja el día de pago vacío).',
              );
              return;
            }

            await create(
              {
                name: values.name,
                debtType: values.debtType,
                originalAmountCents: toCents(Number(values.originalAmount)),
                saldoPendienteCents: toCents(Number(values.saldoPendiente)),
                monthlyPaymentCents: toCents(Number(values.monthlyPayment)),
                remainingPayments: values.remainingPayments ? Number(values.remainingPayments) : null,
                dueDate: hasAutoPayment ? String(paymentDay) : null,
                startDate: values.startDate,
                status: 'activa',
              },
              hasAutoPayment ? { paymentDay, accountId: values.accountId! } : undefined,
            );
            setShowForm(false);
          }}
        />
      )}

      {debts.length === 0 ? (
        <EmptyState message="Sin deudas registradas." />
      ) : (
        debts.map((debt) => {
          const hasChildren = debt.children.length > 0;
          return (
            <Card key={debt.id} style={{ gap: Spacing.two }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText type="smallBold">{debt.name}</ThemedText>
                <Pressable
                  onPress={() =>
                    Alert.alert(
                      'Eliminar deuda',
                      hasChildren
                        ? `¿Eliminar "${debt.name}" y todas sus hijas? Esto no se puede deshacer.`
                        : `¿Eliminar "${debt.name}"? Esto no se puede deshacer.`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Eliminar', style: 'destructive', onPress: () => remove(debt.id) },
                      ],
                    )
                  }
                >
                  <ThemedText themeColor="critical">✕</ThemedText>
                </Pressable>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {hasChildren ? 'Saldo estimado' : 'Saldo pendiente'}: {formatCents(debt.saldoPendienteCents)} ·{' '}
                {hasChildren ? 'Mensualidad (suma de hijas)' : 'Mensualidad'}: {formatCents(debt.monthlyPaymentCents)}
                {!hasChildren && debt.remainingPayments != null ? ` · ${debt.remainingPayments} pagos restantes` : ''}
                {debt.dueDate ? ` · paga el día ${debt.dueDate}` : ' · sin pago automático configurado'}
              </ThemedText>

              {hasChildren && (
                <View style={{ gap: Spacing.one, marginLeft: Spacing.three }}>
                  {debt.children.map((child) => (
                    <View key={child.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <ThemedText type="small" themeColor={child.status === 'pagada' ? 'textSecondary' : 'text'}>
                        {child.status === 'pagada' ? '✅ ' : '· '}
                        {child.name}
                        {child.remainingPayments != null
                          ? ` (${child.remainingPayments} meses restantes)`
                          : ' (indefinida)'}
                      </ThemedText>
                      <ThemedText type="small" themeColor="debt">
                        {formatCents(child.monthlyPaymentCents)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                onPress={() => setChildFormForDebtId((current) => (current === debt.id ? null : debt.id))}
              >
                <ThemedText type="linkPrimary">
                  {childFormForDebtId === debt.id ? 'Cancelar' : '+ Agregar hija'}
                </ThemedText>
              </Pressable>

              {childFormForDebtId === debt.id && (
                <NewChildDebtForm
                  onSubmit={async (values) => {
                    await createChild({
                      parentDebtId: debt.id,
                      name: values.name,
                      debtType: 'msi',
                      monthlyPaymentCents: toCents(Number(values.monthlyPayment)),
                      remainingPayments:
                        values.isIndefinite === 'si' ? null : Number(values.remainingPayments) || 0,
                      startDate: today(),
                    });
                    setChildFormForDebtId(null);
                  }}
                />
              )}

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
          );
        })
      )}
    </ScreenContainer>
  );
}
