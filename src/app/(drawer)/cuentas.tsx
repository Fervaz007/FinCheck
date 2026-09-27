import { Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { Card } from '@/components/Card';
import { ChipSelect } from '@/components/ChipSelect';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useAccounts } from '@/hooks/useAccounts';
import { Spacing } from '@/theme';
import { formatCents, toCents } from '@/utils/money';

interface AccountFormValues {
  name: string;
  type: 'efectivo' | 'banco' | 'tarjeta_debito' | 'tarjeta_credito' | 'otro';
  initialBalance: string;
}

export default function CuentasScreen() {
  const { accounts, create, deactivate } = useAccounts();
  const { control, handleSubmit, reset } = useForm<AccountFormValues>({
    defaultValues: { name: '', type: 'efectivo', initialBalance: '0' },
  });

  const submit = handleSubmit(async (values) => {
    await create({
      name: values.name,
      type: values.type,
      initialBalanceCents: toCents(Number(values.initialBalance) || 0),
    });
    reset({ name: '', type: 'efectivo', initialBalance: '0' });
  });

  return (
    <ScreenContainer>
      <ThemedText type="title">Cuentas</ThemedText>

      <Card style={{ gap: Spacing.two }}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <FormField label="Nombre" value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <ChipSelect
              label="Tipo"
              value={field.value}
              onChange={field.onChange}
              options={[
                { label: 'Efectivo', value: 'efectivo' },
                { label: 'Banco', value: 'banco' },
                { label: 'Tarjeta débito', value: 'tarjeta_debito' },
                { label: 'Tarjeta crédito', value: 'tarjeta_credito' },
                { label: 'Otro', value: 'otro' },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="initialBalance"
          render={({ field }) => (
            <FormField label="Saldo inicial" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Pressable onPress={submit}>
          <Card style={{ alignItems: 'center' }}>
            <ThemedText type="smallBold">+ Agregar cuenta</ThemedText>
          </Card>
        </Pressable>
      </Card>

      {accounts.length === 0 ? (
        <EmptyState message="Sin cuentas registradas. Agrega al menos una para poder registrar movimientos." />
      ) : (
        accounts.map((account) => (
          <Card key={account.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <ThemedText type="smallBold">{account.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {account.type}
              </ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText type="smallBold">{formatCents(account.balanceCents)}</ThemedText>
              <Pressable onPress={() => deactivate(account.id)}>
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
