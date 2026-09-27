import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useBudgetRules } from '@/hooks/useBudgetRules';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { useDebtLimit } from '@/hooks/useDebtLimit';
import { computeBudgetCompliance } from '@/services/financial/budget';
import { computeDebtCapacity } from '@/services/financial/debtLimit';
import { Spacing } from '@/theme';
import { formatCents } from '@/utils/money';

const PRESETS = [
  { name: '50/30/20', allocations: [
    { label: 'necesidades', percentage: 50 },
    { label: 'ocio', percentage: 30 },
    { label: 'ahorro', percentage: 20 },
  ] },
  { name: '40/40/20', allocations: [
    { label: 'necesidades', percentage: 40 },
    { label: 'deudas', percentage: 40 },
    { label: 'ahorro', percentage: 20 },
  ] },
];

export default function PresupuestoScreen() {
  const { rules, activeRule, create, activate } = useBudgetRules();
  const { debtLimitPct, setDebtLimitPct } = useDebtLimit();
  const { summary } = useDashboardSummary();
  const [debtLimitInput, setDebtLimitInput] = useState(String(debtLimitPct));

  const compliance =
    activeRule && summary
      ? computeBudgetCompliance(
          activeRule.allocations,
          {
            necesidades: summary.expenseTotalCents - summary.savingsTotalCents,
            deudas: summary.debtPaymentTotalCents,
            ahorro: summary.savingsTotalCents,
            ocio: 0,
          },
          summary.incomeTotalCents,
        )
      : [];

  const capacity = summary
    ? computeDebtCapacity({
        incomeCents: summary.incomeTotalCents,
        currentDebtPaymentsCents: summary.debtPaymentTotalCents,
        debtLimitPct,
      })
    : null;

  return (
    <ScreenContainer>
      <ThemedText type="title">Presupuesto</ThemedText>

      <Card style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">Regla de presupuesto</ThemedText>
        {rules.map((rule) => (
          <Pressable key={rule.id} onPress={() => activate(rule.id)}>
            <ThemedText themeColor={rule.isActive ? 'primary' : 'text'}>
              {rule.isActive ? '● ' : '○ '}
              {rule.name} ({rule.allocations.map((a) => `${a.label} ${a.percentage}%`).join(' / ')})
            </ThemedText>
          </Pressable>
        ))}
        <View style={{ flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' }}>
          {PRESETS.map((preset) => (
            <Pressable
              key={preset.name}
              onPress={() => create(preset.name, preset.allocations, false)}
            >
              <ThemedText type="linkPrimary">+ Usar {preset.name}</ThemedText>
            </Pressable>
          ))}
        </View>
      </Card>

      {compliance.length > 0 && (
        <Card style={{ gap: Spacing.one }}>
          <ThemedText type="smallBold">Cumplimiento este mes</ThemedText>
          {compliance.map((row) => (
            <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <ThemedText themeColor="textSecondary">
                {row.label} ({row.allocatedPct}%)
              </ThemedText>
              <ThemedText themeColor={row.withinBudget ? 'healthy' : 'critical'}>
                {formatCents(row.actualCents)} / {formatCents(row.allocatedCents)}
              </ThemedText>
            </View>
          ))}
        </Card>
      )}

      <Card style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">Límite de endeudamiento (independiente)</ThemedText>
        <FormField
          label="Límite (%)"
          keyboardType="number-pad"
          value={debtLimitInput}
          onChangeText={setDebtLimitInput}
          onBlur={() => {
            const pct = Number(debtLimitInput);
            if (Number.isFinite(pct) && pct > 0 && pct <= 100) setDebtLimitPct(pct);
            else Alert.alert('Valor inválido', 'Ingresa un porcentaje entre 1 y 100.');
          }}
        />
        {capacity && (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Deuda actual: {capacity.currentRatioPct}% · Límite: {debtLimitPct}%
            </ThemedText>
            <ThemedText type="smallBold">
              Disponible para nueva deuda: {formatCents(capacity.availableCapacityCents)}
            </ThemedText>
          </>
        )}
      </Card>
    </ScreenContainer>
  );
}
