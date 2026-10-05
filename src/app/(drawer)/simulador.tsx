import { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipSelect } from '@/components/ChipSelect';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { createSimulation } from '@/dao/simulationsDao';
import { sumActiveMonthlyCommitmentByType } from '@/dao/debtsDao';
import { useBudgetRules } from '@/hooks/useBudgetRules';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { simulateAMesesPurchase, simulateContadoPurchase } from '@/services/financial/simulator';
import { Spacing } from '@/theme';
import { formatCents, toCents } from '@/utils/money';

interface SimulatorFormValues {
  name: string;
  mode: 'a_meses' | 'contado';
  price: string;
  downPayment: string;
  monthlyPayment: string;
  termMonths: string;
  budgetGroupLabel: string | null;
}

export default function SimuladorScreen() {
  const { summary } = useDashboardSummary();
  const { activeRule } = useBudgetRules();
  const [typeCommitmentCents, setTypeCommitmentCents] = useState(0);

  const budgetGroupOptions = (activeRule?.allocations ?? []).map((a) => ({ label: a.label, value: a.label }));

  const { control, handleSubmit, watch } = useForm<SimulatorFormValues>({
    defaultValues: {
      name: '',
      mode: 'a_meses',
      price: '',
      downPayment: '0',
      monthlyPayment: '',
      termMonths: '',
      budgetGroupLabel: budgetGroupOptions[0]?.value ?? null,
    },
  });

  const values = watch();

  useEffect(() => {
    if (values.mode !== 'a_meses' || !values.budgetGroupLabel) {
      setTypeCommitmentCents(0);
      return;
    }
    sumActiveMonthlyCommitmentByType(values.budgetGroupLabel).then(setTypeCommitmentCents);
  }, [values.mode, values.budgetGroupLabel]);

  const aMesesResult = useMemo(() => {
    if (values.mode !== 'a_meses' || !summary) return null;
    const monthlyPaymentCents = toCents(Number(values.monthlyPayment) || 0);
    const allocation = activeRule?.allocations.find((a) => a.label === values.budgetGroupLabel);
    if (!monthlyPaymentCents || !allocation) return null;
    return simulateAMesesPurchase({
      incomeCents: summary.fixedMonthlyIncomeCents,
      allocatedPct: allocation.percentage,
      currentTypeCommitmentCents: typeCommitmentCents,
      newMonthlyPaymentCents: monthlyPaymentCents,
    });
  }, [values.mode, values.monthlyPayment, values.budgetGroupLabel, activeRule, summary, typeCommitmentCents]);

  const contadoResult = useMemo(() => {
    if (values.mode !== 'contado' || !summary) return null;
    const priceCents = toCents(Number(values.price) || 0);
    if (!priceCents) return null;
    return simulateContadoPurchase({ priceCents, availableCents: summary.availableCents });
  }, [values.mode, values.price, summary]);

  const submit = handleSubmit(async (formValues) => {
    const priceCents = toCents(Number(formValues.price) || 0);
    const downPaymentCents = toCents(Number(formValues.downPayment) || 0);
    const isAMeses = formValues.mode === 'a_meses';
    const monthlyPaymentCents = isAMeses ? toCents(Number(formValues.monthlyPayment) || 0) : 0;

    await createSimulation({
      name: formValues.name || 'Simulación',
      productName: formValues.name,
      priceCents,
      downPaymentCents: isAMeses ? downPaymentCents : priceCents,
      financedAmountCents: isAMeses ? Math.max(0, priceCents - downPaymentCents) : 0,
      monthlyPaymentCents,
      termMonths: isAMeses ? Number(formValues.termMonths) || 0 : 0,
    });
    Alert.alert('Guardado', 'La simulación se guardó para consultarla después.');
  });

  return (
    <ScreenContainer>
      <ThemedText type="title">Simulador</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Simula cualquier compra o deuda nueva: auto, moto, celular, préstamo, tarjeta, viaje...
      </ThemedText>

      <Card style={{ gap: Spacing.three }}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <FormField label="Producto" value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="mode"
          render={({ field }) => (
            <ChipSelect
              label="¿A meses o a contado?"
              value={field.value}
              onChange={field.onChange}
              options={[
                { label: 'A meses (MSI)', value: 'a_meses' },
                { label: 'A contado', value: 'contado' },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="price"
          render={({ field }) => (
            <FormField label="Precio" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} />
          )}
        />

        {values.mode === 'a_meses' && (
          <View style={{ gap: Spacing.three }}>
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
          </View>
        )}
      </Card>

      {aMesesResult && (
        <Card style={{ gap: Spacing.two }}>
          <ThemedText type="caption" themeColor="textSecondary">
            CAPACIDAD EN "{values.budgetGroupLabel}"
          </ThemedText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedText type="small" themeColor="textSecondary">Comprometido en este tipo</ThemedText>
            <ThemedText type="small">
              {formatCents(aMesesResult.beforeCommitmentCents)} → {formatCents(aMesesResult.afterCommitmentCents)}
            </ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedText type="small" themeColor="textSecondary">Límite del tipo</ThemedText>
            <ThemedText type="small">{formatCents(aMesesResult.allocatedCents)}</ThemedText>
          </View>
          <ThemedText type="smallBold" themeColor={aMesesResult.exceedsLimit ? 'critical' : 'healthy'}>
            {aMesesResult.exceedsLimit
              ? `⚠️ Supera la capacidad de "${values.budgetGroupLabel}" por ${formatCents(-aMesesResult.remainingCapacityCents)}.`
              : `🟢 Cabe — quedan ${formatCents(aMesesResult.remainingCapacityCents)} disponibles en ese tipo.`}
          </ThemedText>
          <Button label="Guardar simulación" onPress={submit} />
        </Card>
      )}

      {contadoResult && (
        <Card style={{ gap: Spacing.two }}>
          <ThemedText type="caption" themeColor="textSecondary">
            COMPRA DE CONTADO
          </ThemedText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedText type="small" themeColor="textSecondary">Disponible después</ThemedText>
            <ThemedText type="small">{formatCents(contadoResult.availableAfterCents)}</ThemedText>
          </View>
          <ThemedText type="smallBold" themeColor={contadoResult.exceedsAvailable ? 'critical' : 'healthy'}>
            {contadoResult.exceedsAvailable
              ? '⚠️ No te alcanza con tu disponible actual.'
              : '🟢 Te alcanza con tu disponible actual.'}
          </ThemedText>
          <Button label="Guardar simulación" onPress={submit} />
        </Card>
      )}
    </ScreenContainer>
  );
}
