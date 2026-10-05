import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipSelect } from '@/components/ChipSelect';
import { DataRow } from '@/components/DataRow';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useExpenses } from '@/hooks/useExpenses';
import { useIncome } from '@/hooks/useIncome';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import type { RecurrenceConfig, RecurrenceType } from '@/services/recurring/recurrenceTypes';
import { Spacing } from '@/theme';
import { formatCents, toCents } from '@/utils/money';

type Frequency =
  | 'quincenal'
  | 'semanal'
  | 'mensual_dia'
  | 'mensual_ultimo'
  | 'cada_n_dias'
  | 'cada_n_meses'
  | 'anual';

const FREQUENCY_OPTIONS: { label: string; value: Frequency }[] = [
  { label: 'Quincenal (día 15 y último día)', value: 'quincenal' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'Mensual, día fijo', value: 'mensual_dia' },
  { label: 'Mensual, último día', value: 'mensual_ultimo' },
  { label: 'Cada N días', value: 'cada_n_dias' },
  { label: 'Cada N meses', value: 'cada_n_meses' },
  { label: 'Anual', value: 'anual' },
];

const WEEKDAYS = [
  { label: 'Domingo', value: 0 },
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miércoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sábado', value: 6 },
];

interface MovementFormValues {
  description: string;
  amount: string;
  date: string;
  origin: string;
  isRecurring: 'si' | 'no';
  frequency: Frequency;
  weekday: number;
  monthDay: string;
  intervalDays: string;
  intervalMonths: string;
  annualMonth: string;
  annualDay: string;
  anchorDate: string;
}

const today = () => new Date().toISOString().slice(0, 10);

function buildRecurrence(values: MovementFormValues): { type: RecurrenceType; config: RecurrenceConfig } {
  switch (values.frequency) {
    case 'quincenal':
      return {
        type: 'SEMIMONTHLY_FIXED',
        config: { type: 'SEMIMONTHLY_FIXED', dayA: 15, dayB: 'last' },
      };
    case 'semanal':
      return { type: 'WEEKLY', config: { type: 'WEEKLY', weekday: values.weekday } };
    case 'mensual_dia':
      return {
        type: 'MONTHLY_DAY',
        config: { type: 'MONTHLY_DAY', day: Number(values.monthDay) || 1 },
      };
    case 'mensual_ultimo':
      return { type: 'MONTHLY_LAST_DAY', config: { type: 'MONTHLY_LAST_DAY' } };
    case 'cada_n_dias':
      return {
        type: 'DAILY_INTERVAL',
        config: { type: 'DAILY_INTERVAL', intervalDays: Number(values.intervalDays) || 1 },
      };
    case 'cada_n_meses':
      return {
        type: 'MONTHLY_INTERVAL',
        config: {
          type: 'MONTHLY_INTERVAL',
          every: Number(values.intervalMonths) || 1,
          day: Number(values.monthDay) || 1,
        },
      };
    case 'anual':
      return {
        type: 'ANNUAL',
        config: {
          type: 'ANNUAL',
          month: Number(values.annualMonth) || 1,
          day: Number(values.annualDay) || 1,
        },
      };
  }
}

function MovementForm({
  kind,
  onSubmit,
}: {
  kind: 'income' | 'expense';
  onSubmit: (values: MovementFormValues) => Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<MovementFormValues>({
    defaultValues: {
      description: '',
      amount: '',
      date: today(),
      origin: '',
      isRecurring: 'no',
      frequency: 'quincenal',
      weekday: 1,
      monthDay: '1',
      intervalDays: '15',
      intervalMonths: '2',
      annualMonth: '1',
      annualDay: '1',
      anchorDate: today(),
    },
  });

  const isRecurring = kind === 'income' && watch('isRecurring') === 'si';
  const frequency = watch('frequency');

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    reset({ ...values, description: '', amount: '' });
  });

  return (
    <Card style={{ gap: Spacing.three }}>
      <ThemedText type="heading">{kind === 'income' ? 'Nuevo ingreso' : 'Nuevo egreso'}</ThemedText>
      <Controller
        control={control}
        name="description"
        rules={{ required: 'Requerido' }}
        render={({ field }) => (
          <FormField
            label="Descripción"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.description?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="amount"
        rules={{ required: 'Requerido', pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Monto inválido' } }}
        render={({ field }) => (
          <FormField
            label="Cantidad"
            keyboardType="decimal-pad"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.amount?.message}
          />
        )}
      />

      {kind === 'income' && (
        <Controller
          control={control}
          name="origin"
          render={({ field }) => (
            <FormField
              label="Origen (opcional, solo para tu referencia, no afecta ningún cálculo)"
              placeholder="Efectivo, TDD, Préstamo personal..."
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
      )}

      {kind === 'income' && (
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
      )}

      {!isRecurring && (
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <FormField label="Fecha (YYYY-MM-DD)" value={field.value} onChangeText={field.onChange} />
          )}
        />
      )}

      {isRecurring && (
        <View style={{ gap: Spacing.three }}>
          <Controller
            control={control}
            name="frequency"
            render={({ field }) => (
              <ChipSelect label="Frecuencia" value={field.value} onChange={field.onChange} options={FREQUENCY_OPTIONS} />
            )}
          />
          {frequency === 'semanal' && (
            <Controller
              control={control}
              name="weekday"
              render={({ field }) => (
                <ChipSelect label="Día de la semana" value={field.value} onChange={field.onChange} options={WEEKDAYS} />
              )}
            />
          )}
          {(frequency === 'mensual_dia' || frequency === 'cada_n_meses') && (
            <Controller
              control={control}
              name="monthDay"
              render={({ field }) => (
                <FormField label="Día del mes (1-31)" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} />
              )}
            />
          )}
          {frequency === 'cada_n_dias' && (
            <Controller
              control={control}
              name="intervalDays"
              render={({ field }) => (
                <FormField label="Cada cuántos días" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} />
              )}
            />
          )}
          {frequency === 'cada_n_meses' && (
            <Controller
              control={control}
              name="intervalMonths"
              render={({ field }) => (
                <FormField label="Cada cuántos meses" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} />
              )}
            />
          )}
          {frequency === 'anual' && (
            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="annualMonth"
                  render={({ field }) => (
                    <FormField label="Mes (1-12)" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="annualDay"
                  render={({ field }) => (
                    <FormField label="Día" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} />
                  )}
                />
              </View>
            </View>
          )}
          <Controller
            control={control}
            name="anchorDate"
            render={({ field }) => (
              <FormField label="A partir de (YYYY-MM-DD)" value={field.value} onChangeText={field.onChange} />
            )}
          />
        </View>
      )}

      <Button label="Guardar" onPress={submit} />
    </Card>
  );
}

export default function MovimientosScreen() {
  const [tab, setTab] = useState<'income' | 'expense'>('expense');
  const { income, create: createIncome, remove: removeIncome } = useIncome();
  const { expenses, create: createExpense, remove: removeExpense } = useExpenses();
  const { create: createRecurring } = useRecurringTransactions();

  const rows = useMemo(
    () =>
      tab === 'income'
        ? [...income].sort((a, b) => b.date.localeCompare(a.date))
        : [...expenses].sort((a, b) => b.date.localeCompare(a.date)),
    [tab, income, expenses],
  );

  return (
    <ScreenContainer>
      <ThemedText type="title">Movimientos</ThemedText>

      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        <Button
          label="Egresos"
          variant={tab === 'expense' ? 'primary' : 'secondary'}
          onPress={() => setTab('expense')}
          style={{ flex: 1 }}
        />
        <Button
          label="Ingresos"
          variant={tab === 'income' ? 'primary' : 'secondary'}
          onPress={() => setTab('income')}
          style={{ flex: 1 }}
        />
      </View>

      <MovementForm
        kind={tab}
        onSubmit={async (values) => {
          if (tab === 'expense') {
            await createExpense({
              description: values.description,
              amountCents: toCents(Number(values.amount)),
              date: values.date,
            });
            return;
          }

          if (values.isRecurring === 'si') {
            const { type, config } = buildRecurrence(values);
            await createRecurring({
              kind: 'income',
              description: values.description,
              origin: values.origin || null,
              amountCents: toCents(Number(values.amount)),
              recurrenceType: type,
              recurrenceConfig: config,
              anchorDate: values.anchorDate,
            });
            Alert.alert(
              'Guardado',
              'Este ingreso se generará automáticamente en cada fecha, según la frecuencia elegida.',
            );
            return;
          }

          await createIncome({
            description: values.description,
            amountCents: toCents(Number(values.amount)),
            date: values.date,
            origin: values.origin || null,
          });
        }}
      />

      {rows.length === 0 ? (
        <EmptyState message={`Sin ${tab === 'income' ? 'ingresos' : 'egresos'} registrados este mes.`} />
      ) : (
        rows.map((row) => (
          <Card key={row.id}>
            <DataRow
              title={row.description}
              subtitle={row.date}
              amount={formatCents(row.amountCents)}
              amountColor={tab === 'income' ? 'income' : 'expense'}
              action={
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    Alert.alert('Eliminar', '¿Eliminar este movimiento?', [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => (tab === 'income' ? removeIncome(row.id) : removeExpense(row.id)),
                      },
                    ])
                  }
                >
                  <ThemedText themeColor="critical">✕</ThemedText>
                </Pressable>
              }
            />
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}
