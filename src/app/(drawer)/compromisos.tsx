import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { Card } from '@/components/Card';
import { ChipSelect } from '@/components/ChipSelect';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useCommitments } from '@/hooks/useCommitments';
import { useDebts } from '@/hooks/useDebts';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import { computeAdjustedAvailable, isCommitmentComplete, perPeriodAmountCents } from '@/services/financial/commitments';
import { Spacing } from '@/theme';
import { formatCents, toCents } from '@/utils/money';

type Source = 'standalone' | 'debt' | 'recurring';

interface CommitmentFormValues {
  source: Source;
  name: string;
  totalAmount: string;
  periodsToSpread: string;
  linkedDebtId: number | null;
  linkedRecurringTransactionId: number | null;
}

export default function CompromisosScreen() {
  const { commitments, create, deactivate, markPeriodReserved, resetCycle } = useCommitments();
  const { debts } = useDebts();
  const { items: recurringItems } = useRecurringTransactions();
  const recurringExpenses = recurringItems.filter((r) => r.kind === 'expense');
  const [periodIncomeInput, setPeriodIncomeInput] = useState('');

  const { control, handleSubmit, watch, reset } = useForm<CommitmentFormValues>({
    defaultValues: {
      source: 'debt',
      name: '',
      totalAmount: '',
      periodsToSpread: '2',
      linkedDebtId: null,
      linkedRecurringTransactionId: null,
    },
  });

  const source = watch('source');

  const submit = handleSubmit(async (values) => {
    const periodsToSpread = Number(values.periodsToSpread);
    if (periodsToSpread < 1) {
      Alert.alert('Falta el número de quincenas', 'Indica en cuántas quincenas repartirlo.');
      return;
    }

    if (source === 'debt') {
      if (!values.linkedDebtId) {
        Alert.alert('Falta la deuda', 'Elige a qué deuda vincular este compromiso.');
        return;
      }
      const debt = debts.find((d) => d.id === values.linkedDebtId);
      await create({
        name: values.name.trim() || debt?.name || 'Deuda',
        linkedDebtId: values.linkedDebtId,
        periodsToSpread,
      });
    } else if (source === 'recurring') {
      if (!values.linkedRecurringTransactionId) {
        Alert.alert('Falta el recurrente', 'Elige a qué egreso recurrente vincular este compromiso.');
        return;
      }
      const rt = recurringExpenses.find((r) => r.id === values.linkedRecurringTransactionId);
      await create({
        name: values.name.trim() || rt?.description || 'Recurrente',
        linkedRecurringTransactionId: values.linkedRecurringTransactionId,
        periodsToSpread,
      });
    } else {
      const totalAmountCents = toCents(Number(values.totalAmount));
      if (!values.name.trim() || !totalAmountCents) {
        Alert.alert('Datos incompletos', 'Ingresa nombre y monto total.');
        return;
      }
      await create({ name: values.name.trim(), totalAmountCents, periodsToSpread });
    }

    reset({
      source,
      name: '',
      totalAmount: '',
      periodsToSpread: values.periodsToSpread,
      linkedDebtId: null,
      linkedRecurringTransactionId: null,
    });
  });

  const adjusted = useMemo(() => {
    const periodIncomeCents = toCents(Number(periodIncomeInput) || 0);
    return computeAdjustedAvailable(periodIncomeCents, commitments);
  }, [periodIncomeInput, commitments]);

  return (
    <ScreenContainer>
      <ThemedText type="title">Compromisos</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Cosas que ya sabes que vienen (una deuda mensual, un recibo bimestral) repartidas entre tus
        quincenas, para que sepas cuánto apartar de tu dinero disponible ANTES de gastarlo — no se
        mueve nada de ninguna cuenta, es solo un apartado mental que tú confirmas.
      </ThemedText>

      <Card style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">Nuevo compromiso</ThemedText>

        <Controller
          control={control}
          name="source"
          render={({ field }) => (
            <ChipSelect
              label="¿De dónde sale el monto?"
              value={field.value}
              onChange={field.onChange}
              options={[
                { label: 'Vincular a una deuda', value: 'debt' },
                { label: 'Vincular a un recurrente', value: 'recurring' },
                { label: 'Escribirlo yo (manual)', value: 'standalone' },
              ]}
            />
          )}
        />

        {source === 'debt' && (
          <Controller
            control={control}
            name="linkedDebtId"
            render={({ field }) => (
              <ChipSelect
                label="Deuda"
                value={field.value}
                onChange={field.onChange}
                options={debts.map((d) => ({
                  label: `${d.name} (${formatCents(d.monthlyPaymentCents)}/mes)`,
                  value: d.id,
                }))}
              />
            )}
          />
        )}

        {source === 'recurring' && (
          <Controller
            control={control}
            name="linkedRecurringTransactionId"
            render={({ field }) => (
              <ChipSelect
                label="Egreso recurrente"
                value={field.value}
                onChange={field.onChange}
                options={recurringExpenses.map((r) => ({
                  label: `${r.description} (${formatCents(r.amountCents)})`,
                  value: r.id,
                }))}
              />
            )}
          />
        )}

        {source !== 'standalone' && (
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <FormField
                label="Nombre (opcional, si no se usa el de la deuda/recurrente)"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
        )}

        {source === 'standalone' && (
          <>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <FormField label="Nombre" placeholder="Luz, Predial..." value={field.value} onChangeText={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="totalAmount"
              render={({ field }) => (
                <FormField
                  label="Monto total del compromiso"
                  keyboardType="decimal-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                />
              )}
            />
          </>
        )}

        <Controller
          control={control}
          name="periodsToSpread"
          render={({ field }) => (
            <FormField
              label="¿En cuántas quincenas repartirlo?"
              keyboardType="number-pad"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        <Pressable onPress={submit}>
          <Card style={{ alignItems: 'center' }}>
            <ThemedText type="smallBold">+ Agregar compromiso</ThemedText>
          </Card>
        </Pressable>
      </Card>

      {commitments.length === 0 ? (
        <EmptyState message="Sin compromisos todavía." />
      ) : (
        commitments.map((c) => {
          const perPeriod = perPeriodAmountCents(c);
          const complete = isCommitmentComplete(c);
          return (
            <Card key={c.id} style={{ gap: Spacing.one }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText type="smallBold">{c.name}</ThemedText>
                <Pressable
                  onPress={() =>
                    Alert.alert('Eliminar', `¿Eliminar el compromiso "${c.name}"?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: () => deactivate(c.id) },
                    ])
                  }
                >
                  <ThemedText themeColor="critical">✕</ThemedText>
                </Pressable>
              </View>
              {c.linkedLabel && (
                <ThemedText type="small" themeColor="primary">
                  🔗 {c.linkedLabel} (monto siempre actualizado desde ahí)
                </ThemedText>
              )}
              <ThemedText type="small" themeColor="textSecondary">
                {formatCents(c.totalAmountCents)} en {c.periodsToSpread} quincenas · aparta{' '}
                {formatCents(perPeriod)} c/quincena
              </ThemedText>
              <ThemedText themeColor={complete ? 'healthy' : 'text'}>
                Llevas: {formatCents(c.accumulatedCents)} / {formatCents(c.totalAmountCents)}
                {complete ? ' — ✅ completo, listo para pagarlo' : ''}
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: Spacing.three }}>
                {!complete && (
                  <Pressable onPress={() => markPeriodReserved(c.id)}>
                    <ThemedText type="linkPrimary">Apartar esta quincena (+{formatCents(perPeriod)})</ThemedText>
                  </Pressable>
                )}
                <Pressable
                  onPress={() =>
                    Alert.alert('Reiniciar ciclo', `¿Ya pagaste "${c.name}"? Esto reinicia el conteo a $0.`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Reiniciar', onPress: () => resetCycle(c.id) },
                    ])
                  }
                >
                  <ThemedText type="small" themeColor="textSecondary">
                    Ya pagué esto / reiniciar
                  </ThemedText>
                </Pressable>
              </View>
            </Card>
          );
        })
      )}

      {commitments.length > 0 && (
        <Card style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold">Tu disponible real esta quincena</ThemedText>
          <FormField
            label="Ingreso total de esta quincena (todos tus ingresos)"
            keyboardType="decimal-pad"
            value={periodIncomeInput}
            onChangeText={setPeriodIncomeInput}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedText themeColor="textSecondary">Reservado para compromisos</ThemedText>
            <ThemedText themeColor="debt">{formatCents(adjusted.reservedCents)}</ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedText type="smallBold">Disponible real para ti</ThemedText>
            <ThemedText type="smallBold" themeColor={adjusted.adjustedAvailableCents >= 0 ? 'healthy' : 'critical'}>
              {formatCents(adjusted.adjustedAvailableCents)}
            </ThemedText>
          </View>
        </Card>
      )}
    </ScreenContainer>
  );
}
