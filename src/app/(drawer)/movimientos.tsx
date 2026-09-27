import { useMemo, useState } from 'react';
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
import { useExpenses } from '@/hooks/useExpenses';
import { useIncome } from '@/hooks/useIncome';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/theme';
import { formatCents, toCents } from '@/utils/money';

interface MovementFormValues {
  description: string;
  amount: string;
  date: string;
  categoryId: number | null;
  accountId: number | null;
}

const today = () => new Date().toISOString().slice(0, 10);

function MovementForm({
  kind,
  onSubmit,
}: {
  kind: 'income' | 'expense';
  onSubmit: (values: MovementFormValues) => Promise<void>;
}) {
  const { accounts } = useAccounts();
  const { categories } = useCategories(kind);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MovementFormValues>({
    defaultValues: { description: '', amount: '', date: today(), categoryId: null, accountId: null },
  });

  const submit = handleSubmit(async (values) => {
    if (!values.accountId) {
      Alert.alert('Falta la cuenta', 'Selecciona de qué cuenta sale/entra el dinero.');
      return;
    }
    await onSubmit(values);
    reset({ description: '', amount: '', date: today(), categoryId: null, accountId: values.accountId });
  });

  return (
    <Card style={{ gap: Spacing.two }}>
      <ThemedText type="smallBold">{kind === 'income' ? 'Nuevo ingreso' : 'Nuevo egreso'}</ThemedText>
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
      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <FormField label="Fecha (YYYY-MM-DD)" value={field.value} onChangeText={field.onChange} />
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
      <Pressable onPress={submit}>
        <Card style={{ alignItems: 'center' }}>
          <ThemedText type="smallBold">Guardar</ThemedText>
        </Card>
      </Pressable>
    </Card>
  );
}

export default function MovimientosScreen() {
  const theme = useTheme();
  const [tab, setTab] = useState<'income' | 'expense'>('expense');
  const { income, create: createIncome, remove: removeIncome } = useIncome();
  const { expenses, create: createExpense, remove: removeExpense } = useExpenses();

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
        <Pressable onPress={() => setTab('expense')} style={{ flex: 1 }}>
          <Card style={{ backgroundColor: tab === 'expense' ? theme.backgroundSelected : undefined }}>
            <ThemedText style={{ textAlign: 'center' }}>Egresos</ThemedText>
          </Card>
        </Pressable>
        <Pressable onPress={() => setTab('income')} style={{ flex: 1 }}>
          <Card style={{ backgroundColor: tab === 'income' ? theme.backgroundSelected : undefined }}>
            <ThemedText style={{ textAlign: 'center' }}>Ingresos</ThemedText>
          </Card>
        </Pressable>
      </View>

      <MovementForm
        kind={tab}
        onSubmit={async (values) => {
          const input = {
            description: values.description,
            amountCents: toCents(Number(values.amount)),
            date: values.date,
            categoryId: values.categoryId,
            accountId: values.accountId!,
          };
          if (tab === 'income') await createIncome(input);
          else await createExpense(input);
        }}
      />

      {rows.length === 0 ? (
        <EmptyState message={`Sin ${tab === 'income' ? 'ingresos' : 'egresos'} registrados este mes.`} />
      ) : (
        rows.map((row) => (
          <Card key={row.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <ThemedText type="smallBold">{row.description}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {row.date}
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
              <ThemedText themeColor={tab === 'income' ? 'income' : 'expense'}>
                {formatCents(row.amountCents)}
              </ThemedText>
              <Pressable
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
            </View>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}
