import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { createSimulation } from '@/dao/simulationsDao';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { useDebtLimit } from '@/hooks/useDebtLimit';
import { simulateNewDebt } from '@/services/financial/simulator';
import { Spacing } from '@/theme';
import { formatCents, toCents } from '@/utils/money';

interface SimulatorFormValues {
  name: string;
  price: string;
  downPayment: string;
  monthlyPayment: string;
  termMonths: string;
}

export default function SimuladorScreen() {
  const { summary } = useDashboardSummary();
  const { debtLimitPct } = useDebtLimit();
  const [saved, setSaved] = useState(false);

  const { control, handleSubmit, watch } = useForm<SimulatorFormValues>({
    defaultValues: { name: '', price: '', downPayment: '0', monthlyPayment: '', termMonths: '' },
  });

  const values = watch();

  const result = useMemo(() => {
    const monthlyPaymentCents = toCents(Number(values.monthlyPayment) || 0);
    if (!summary || !monthlyPaymentCents) return null;
    return simulateNewDebt({
      incomeCents: summary.incomeTotalCents,
      currentDebtPaymentsCents: summary.debtPaymentTotalCents,
      debtLimitPct,
      newMonthlyPaymentCents: monthlyPaymentCents,
      currentAvailableCents: summary.availableCents,
    });
  }, [values.monthlyPayment, summary, debtLimitPct]);

  const submit = handleSubmit(async (formValues) => {
    const priceCents = toCents(Number(formValues.price) || 0);
    const downPaymentCents = toCents(Number(formValues.downPayment) || 0);
    await createSimulation({
      name: formValues.name || 'Simulación',
      productName: formValues.name,
      priceCents,
      downPaymentCents,
      financedAmountCents: Math.max(0, priceCents - downPaymentCents),
      monthlyPaymentCents: toCents(Number(formValues.monthlyPayment) || 0),
      termMonths: Number(formValues.termMonths) || 0,
    });
    setSaved(true);
    Alert.alert('Guardado', 'La simulación se guardó para consultarla después.');
  });

  return (
    <ScreenContainer>
      <ThemedText type="title">Simulador</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Simula cualquier compra o deuda nueva: auto, moto, celular, préstamo, tarjeta, viaje...
      </ThemedText>

      <Card style={{ gap: Spacing.two }}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <FormField label="Producto" value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="price"
          render={({ field }) => (
            <FormField label="Precio" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="downPayment"
          render={({ field }) => (
            <FormField label="Enganche" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="monthlyPayment"
          render={({ field }) => (
            <FormField label="Mensualidad" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="termMonths"
          render={({ field }) => (
            <FormField label="Plazo (meses)" keyboardType="number-pad" value={field.value} onChangeText={field.onChange} />
          )}
        />
      </Card>

      {result && (
        <Card style={{ gap: Spacing.two }}>
          <ThemedText type="smallBold">SITUACIÓN ACTUAL vs. CON NUEVA COMPRA</ThemedText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedText themeColor="textSecondary">Deudas</ThemedText>
            <ThemedText>
              {formatCents(result.before.debtPaymentsCents)} → {formatCents(result.after.debtPaymentsCents)}
            </ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedText themeColor="textSecondary">Endeudamiento</ThemedText>
            <ThemedText themeColor={result.exceedsLimit ? 'critical' : 'healthy'}>
              {result.before.debtRatioPct}% → {result.after.debtRatioPct}%
            </ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedText themeColor="textSecondary">Disponible después</ThemedText>
            <ThemedText>{formatCents(result.availableAfterCents)}</ThemedText>
          </View>
          <ThemedText themeColor={result.exceedsLimit ? 'critical' : 'healthy'}>
            {result.exceedsLimit
              ? `⚠️ La nueva deuda supera el límite establecido (${debtLimitPct}%).`
              : '🟢 Dentro del límite establecido.'}
          </ThemedText>
          <Pressable onPress={submit}>
            <Card style={{ alignItems: 'center' }}>
              <ThemedText type="smallBold">Guardar simulación</ThemedText>
            </Card>
          </Pressable>
        </Card>
      )}
    </ScreenContainer>
  );
}
