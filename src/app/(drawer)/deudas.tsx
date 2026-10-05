import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useFocusEffect } from 'expo-router';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipSelect } from '@/components/ChipSelect';
import { DataRow } from '@/components/DataRow';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useBudgetRules } from '@/hooks/useBudgetRules';
import { useDebts } from '@/hooks/useDebts';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { Spacing } from '@/theme';
import { formatCents, toCents } from '@/utils/money';

interface DebtFormValues {
  kind: 'padre' | 'normal';
  name: string;
  budgetGroupLabel: string | null;
  periodicity: 'mensual' | 'bimestral';
  isRecurring: 'si' | 'no';
  paymentDay: string;
  startingReserve: string;
  totalAmount: string;
  remainingPayments: string;
}

interface ChildDebtFormValues {
  name: string;
  monthlyPayment: string;
  isIndefinite: 'si' | 'no';
  remainingPayments: string;
}

const today = () => new Date().toISOString().slice(0, 10);

function NewDebtForm({
  budgetGroupOptions,
  onSubmit,
}: {
  budgetGroupOptions: { label: string; value: string }[];
  onSubmit: (values: DebtFormValues) => Promise<void>;
}) {
  const { control, handleSubmit, watch, reset } = useForm<DebtFormValues>({
    defaultValues: {
      kind: 'normal',
      name: '',
      budgetGroupLabel: budgetGroupOptions[0]?.value ?? null,
      periodicity: 'mensual',
      isRecurring: 'no',
      paymentDay: '',
      startingReserve: '0',
      totalAmount: '',
      remainingPayments: '',
    },
  });

  const kind = watch('kind');
  const isRecurring = watch('isRecurring') === 'si';

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    reset();
  });

  return (
    <Card style={{ gap: Spacing.three }}>
      <ThemedText type="heading">Nueva deuda</ThemedText>
      <Controller
        control={control}
        name="kind"
        render={({ field }) => (
          <ChipSelect
            label="¿Padre o normal?"
            value={field.value}
            onChange={field.onChange}
            options={[
              { label: 'Deuda padre (con hijas)', value: 'padre' },
              { label: 'Deuda normal', value: 'normal' },
            ]}
          />
        )}
      />
      {kind === 'padre' && (
        <ThemedText type="caption" themeColor="textSecondary">
          Registra el padre solo con estos datos; el monto y la mensualidad se calculan solos en
          cuanto le agregues hijas.
        </ThemedText>
      )}
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <FormField label="Nombre" value={field.value} onChangeText={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="budgetGroupLabel"
        render={({ field }) => (
          <ChipSelect
            label="Tipo"
            value={field.value}
            onChange={field.onChange}
            options={budgetGroupOptions}
          />
        )}
      />
      <Controller
        control={control}
        name="periodicity"
        render={({ field }) => (
          <ChipSelect
            label="Periodicidad"
            value={field.value}
            onChange={field.onChange}
            options={[
              { label: 'Mensual', value: 'mensual' },
              { label: 'Bimestral', value: 'bimestral' },
            ]}
          />
        )}
      />

      {kind === 'normal' && (
        <View style={{ gap: Spacing.three }}>
          <Controller
            control={control}
            name="totalAmount"
            render={({ field }) => (
              <FormField label="Pago total" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
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
        </View>
      )}

      <Controller
        control={control}
        name="isRecurring"
        render={({ field }) => (
          <ChipSelect
            label="¿Es recurrente?"
            value={field.value}
            onChange={field.onChange}
            options={[
              { label: 'Sí', value: 'si' },
              { label: 'No', value: 'no' },
            ]}
          />
        )}
      />
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
        name="startingReserve"
        render={({ field }) => (
          <FormField
            label="Apartado inicial (lo que ya llevas ahorrado para esta deuda)"
            keyboardType="decimal-pad"
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      {isRecurring && (
        <ThemedText type="caption" themeColor="textSecondary">
          Al ser recurrente, aparecerá en Apartados y se generarán sus pagos automáticamente.
        </ThemedText>
      )}

      <Button label="Guardar deuda" onPress={submit} />
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
    <Card elevated style={{ gap: Spacing.three, marginLeft: Spacing.three }}>
      <ThemedText type="heading">Nueva hija</ThemedText>
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
      <Button label="Guardar hija" onPress={submit} />
    </Card>
  );
}

export default function DeudasScreen() {
  const { debts, create, createChild, remove } = useDebts();
  const { activeRule } = useBudgetRules();
  const { items: recurringItems, refresh: refreshRecurring } = useRecurringTransactions();
  const [showForm, setShowForm] = useState(false);
  const [childFormForDebtId, setChildFormForDebtId] = useState<number | null>(null);

  // The drawer keeps this screen mounted; refetch so a recurring income added
  // from Movimientos is reflected in the gate when the user returns here.
  useFocusEffect(
    useCallback(() => {
      refreshRecurring();
    }, [refreshRecurring]),
  );

  const hasRecurringIncome = recurringItems.some((i) => i.kind === 'income');
  const canCreateDebts = Boolean(activeRule) && hasRecurringIncome;
  const budgetGroupOptions = (activeRule?.allocations ?? []).map((a) => ({ label: a.label, value: a.label }));

  const toggleForm = () => {
    if (!activeRule) {
      Alert.alert(
        'Falta una regla presupuestaria',
        'Para registrar deudas necesitas una regla presupuestaria activa (para elegir el Tipo). Ve a Reglas presupuestarias.',
      );
      return;
    }
    if (!hasRecurringIncome) {
      Alert.alert(
        'Falta un ingreso recurrente',
        'Para registrar deudas necesitas al menos un ingreso recurrente (tu ingreso fijo mensual, base de los cálculos). Agrégalo en Movimientos.',
      );
      return;
    }
    setShowForm((s) => !s);
  };

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText type="title">Deudas</ThemedText>
        <Button
          label={showForm ? 'Cancelar' : '+ Nueva'}
          variant="secondary"
          onPress={toggleForm}
          style={{ minHeight: 40, paddingHorizontal: Spacing.three }}
        />
      </View>

      {showForm && canCreateDebts && (
        <NewDebtForm
          budgetGroupOptions={budgetGroupOptions}
          onSubmit={async (values) => {
            const isParent = values.kind === 'padre';
            const isRecurring = values.isRecurring === 'si';
            const paymentDayNum = Number(values.paymentDay);

            if (isRecurring && !(paymentDayNum >= 1 && paymentDayNum <= 31)) {
              Alert.alert('Día de pago inválido', 'Si es recurrente, indica un día de pago entre 1 y 31.');
              return;
            }
            if (!values.budgetGroupLabel) {
              Alert.alert('Falta el tipo', 'Selecciona a qué grupo de tu regla pertenece esta deuda.');
              return;
            }

            const remainingPayments = isParent
              ? null
              : values.remainingPayments
                ? Number(values.remainingPayments)
                : null;
            const totalAmountCents = isParent ? 0 : toCents(Number(values.totalAmount) || 0);
            const placeholderSaldoCents = isParent
              ? 0
              : remainingPayments != null
                ? totalAmountCents * remainingPayments
                : totalAmountCents;
            const startDate = today();

            await create({
              name: values.name,
              debtType: 'general',
              isParent,
              originalAmountCents: placeholderSaldoCents,
              saldoPendienteCents: placeholderSaldoCents,
              monthlyPaymentCents: totalAmountCents,
              remainingPayments,
              dueDate: isRecurring ? String(paymentDayNum) : null,
              startDate,
              status: 'activa',
              budgetGroupLabel: values.budgetGroupLabel,
              periodicity: values.periodicity,
              isRecurring,
              // Consumable "apartado inicial" offset buffer; reconciliation leaves
              // reserveLastAccrualDate unset so the current quincena counts at once.
              reserveAccumulatedCents: toCents(Number(values.startingReserve) || 0),
            });
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
            <Card key={debt.id} style={{ gap: Spacing.three }}>
              <DataRow
                title={debt.name}
                amountLabel={hasChildren ? 'Saldo estimado' : 'Saldo pendiente'}
                amount={formatCents(debt.saldoPendienteCents)}
                amountColor="debt"
                action={
                  <Pressable
                    hitSlop={8}
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
                }
                subtitle={
                  <View style={{ gap: 2 }}>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {debt.budgetGroupLabel ?? 'Sin tipo'} ·{' '}
                      {hasChildren ? 'Mensualidad (suma de hijas)' : 'Mensualidad'}:{' '}
                      {formatCents(debt.monthlyPaymentCents)}
                    </ThemedText>
                    {!hasChildren && debt.remainingPayments != null && (
                      <ThemedText type="caption" themeColor="textSecondary">
                        {debt.remainingPayments} pagos restantes
                      </ThemedText>
                    )}
                    <ThemedText type="caption" themeColor="textSecondary">
                      {debt.isRecurring ? `${debt.periodicity} · paga el día ${debt.dueDate}` : 'No recurrente'}
                    </ThemedText>
                  </View>
                }
              >
                {hasChildren && (
                  <View style={{ gap: Spacing.two, marginLeft: Spacing.three, marginTop: Spacing.one }}>
                    {debt.children.map((child) => (
                      <Card key={child.id} elevated style={{ gap: Spacing.half }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <ThemedText
                            type="smallBold"
                            themeColor={child.status === 'pagada' ? 'textSecondary' : 'text'}
                          >
                            {child.status === 'pagada' ? '✅ ' : ''}
                            {child.name}
                          </ThemedText>
                          <ThemedText type="smallBold" themeColor="debt">
                            {formatCents(child.monthlyPaymentCents)}
                          </ThemedText>
                        </View>
                        <ThemedText type="caption" themeColor="textSecondary">
                          {child.remainingPayments != null
                            ? `${child.remainingPayments} meses restantes`
                            : 'Indefinida'}
                        </ThemedText>
                      </Card>
                    ))}
                  </View>
                )}

                {debt.isParent && (
                  <Button
                    label={childFormForDebtId === debt.id ? 'Cancelar' : '+ Agregar hija'}
                    variant="secondary"
                    onPress={() => setChildFormForDebtId((current) => (current === debt.id ? null : debt.id))}
                    style={{ minHeight: 40, alignSelf: 'flex-start', marginTop: Spacing.two }}
                  />
                )}

                {debt.isParent && childFormForDebtId === debt.id && (
                  <View style={{ marginTop: Spacing.two }}>
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
                  </View>
                )}
              </DataRow>
            </Card>
          );
        })
      )}
    </ScreenContainer>
  );
}
