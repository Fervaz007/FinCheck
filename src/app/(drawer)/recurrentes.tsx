import { Alert, Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { Card } from '@/components/Card';
import { ChipSelect } from '@/components/ChipSelect';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
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

function describeRecurrence(recurrenceType: string, config: RecurrenceConfig): string {
  switch (recurrenceType) {
    case 'SEMIMONTHLY_FIXED':
      return 'Quincenal (día 15 y último día)';
    case 'WEEKLY': {
      const day = WEEKDAYS.find((w) => w.value === (config as { weekday: number }).weekday);
      return `Semanal (${day?.label ?? '?'})`;
    }
    case 'MONTHLY_DAY':
      return `Mensual, día ${(config as { day: number }).day}`;
    case 'MONTHLY_LAST_DAY':
      return 'Mensual, último día';
    case 'DAILY_INTERVAL':
      return `Cada ${(config as { intervalDays: number }).intervalDays} días`;
    case 'MONTHLY_INTERVAL':
      return `Cada ${(config as { every: number }).every} meses (día ${(config as { day: number }).day})`;
    case 'ANNUAL':
      return `Anual (${(config as { month: number }).month}/${(config as { day: number }).day})`;
    default:
      return recurrenceType;
  }
}

interface RecurringFormValues {
  kind: 'income' | 'expense';
  description: string;
  amount: string;
  accountId: number | null;
  categoryId: number | null;
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

function buildRecurrence(values: RecurringFormValues): { type: RecurrenceType; config: RecurrenceConfig } {
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

export default function RecurrentesScreen() {
  const { accounts } = useAccounts();
  const { items, create, deactivate } = useRecurringTransactions();
  const { control, handleSubmit, watch, reset } = useForm<RecurringFormValues>({
    defaultValues: {
      kind: 'income',
      description: '',
      amount: '',
      accountId: null,
      categoryId: null,
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

  const kind = watch('kind');
  const frequency = watch('frequency');
  const { categories } = useCategories(kind);

  const submit = handleSubmit(async (values) => {
    if (!values.accountId) {
      Alert.alert('Falta la cuenta', 'Selecciona a qué cuenta afecta este movimiento recurrente.');
      return;
    }
    if (!values.description.trim() || !Number(values.amount)) {
      Alert.alert('Datos incompletos', 'Ingresa una descripción y una cantidad válida.');
      return;
    }

    const { type, config } = buildRecurrence(values);

    await create({
      kind: values.kind,
      description: values.description,
      categoryId: values.categoryId,
      accountId: values.accountId,
      amountCents: toCents(Number(values.amount)),
      recurrenceType: type,
      recurrenceConfig: config,
      anchorDate: values.anchorDate,
    });

    reset({ ...values, description: '', amount: '' });
    Alert.alert(
      'Guardado',
      'Se generarán automáticamente los movimientos correspondientes cada vez que abras la app, según la frecuencia elegida.',
    );
  });

  return (
    <ScreenContainer>
      <ThemedText type="title">Recurrentes</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Sueldo, renta, Netflix, gas... cualquier ingreso o egreso que se repite. FinCheck lo genera
        solo cada vez que abras la app, aunque hayan pasado semanas.
      </ThemedText>

      <Card style={{ gap: Spacing.two }}>
        <Controller
          control={control}
          name="kind"
          render={({ field }) => (
            <ChipSelect
              label="Tipo"
              value={field.value}
              onChange={field.onChange}
              options={[
                { label: 'Ingreso', value: 'income' },
                { label: 'Egreso', value: 'expense' },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <FormField
              label="Descripción"
              placeholder={kind === 'income' ? 'Sueldo' : 'Netflix'}
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <FormField label="Cantidad" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="accountId"
          render={({ field }) => (
            <ChipSelect
              label="Cuenta"
              value={field.value}
              onChange={field.onChange}
              options={accounts.map((a) => ({ label: a.name, value: a.id }))}
            />
          )}
        />
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <ChipSelect
              label="Categoría"
              value={field.value}
              onChange={field.onChange}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          )}
        />
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

        <Pressable onPress={submit}>
          <Card style={{ alignItems: 'center' }}>
            <ThemedText type="smallBold">Guardar recurrente</ThemedText>
          </Card>
        </Pressable>
      </Card>

      <ThemedText type="smallBold" themeColor="textSecondary">
        ACTIVOS
      </ThemedText>
      {items.length === 0 ? (
        <EmptyState message="Sin movimientos recurrentes todavía." />
      ) : (
        items.map((item) => (
          <Card key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <ThemedText type="smallBold">{item.description}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.kind === 'income' ? 'Ingreso' : 'Egreso'} ·{' '}
                {describeRecurrence(item.recurrenceType, item.recurrenceConfig as RecurrenceConfig)}
              </ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText themeColor={item.kind === 'income' ? 'income' : 'expense'}>
                {formatCents(item.amountCents)}
              </ThemedText>
              <Pressable
                onPress={() =>
                  Alert.alert('Desactivar', `¿Dejar de generar "${item.description}" automáticamente?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Desactivar', style: 'destructive', onPress: () => deactivate(item.id) },
                  ])
                }
              >
                <ThemedText type="small" themeColor="critical">
                  Desactivar
                </ThemedText>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}
