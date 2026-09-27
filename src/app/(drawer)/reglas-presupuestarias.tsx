import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useBudgetRules } from '@/hooks/useBudgetRules';
import { validateAllocationsSumTo100 } from '@/services/financial/budget';
import { Spacing } from '@/theme';

interface Row {
  id: number;
  label: string;
  percentage: string;
}

const MIN_GROUPS = 1;
const MAX_GROUPS = 5;

let nextRowId = 0;
const makeRow = (label = '', percentage = ''): Row => ({ id: nextRowId++, label, percentage });

export default function ReglasPresupuestariasScreen() {
  const { rules, create, activate } = useBudgetRules();
  const [name, setName] = useState('');
  const [rows, setRows] = useState<Row[]>(() => [
    makeRow('necesidades'),
    makeRow('deudas'),
    makeRow('ahorro'),
  ]);

  const sum = rows.reduce((acc, r) => acc + (Number(r.percentage) || 0), 0);

  const updateRow = (id: number, field: 'label' | 'percentage', value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => (prev.length < MAX_GROUPS ? [...prev, makeRow()] : prev));
  const removeRow = (id: number) =>
    setRows((prev) => (prev.length > MIN_GROUPS ? prev.filter((r) => r.id !== id) : prev));

  const save = async () => {
    const allocations = rows
      .filter((r) => r.label.trim() && r.percentage.trim())
      .map((r) => ({ label: r.label.trim(), percentage: Number(r.percentage) }));

    const { valid, sum: total } = validateAllocationsSumTo100(allocations);
    if (!valid) {
      Alert.alert('La suma debe ser 100%', `Actualmente suma ${total}%.`);
      return;
    }
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Dale un nombre a tu regla personalizada.');
      return;
    }

    await create(name.trim(), allocations, true);
    setName('');
    Alert.alert('Guardada', 'Tu regla personalizada fue creada. Actívala desde Presupuesto.');
  };

  return (
    <ScreenContainer>
      <ThemedText type="title">Reglas presupuestarias</ThemedText>

      <Card style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">Nueva regla personalizada</ThemedText>
        <FormField label="Nombre" value={name} onChangeText={setName} />
        {rows.map((row) => (
          <View key={row.id} style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-end' }}>
            <View style={{ flex: 2 }}>
              <FormField label="Grupo" value={row.label} onChangeText={(v) => updateRow(row.id, 'label', v)} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="%"
                keyboardType="number-pad"
                value={row.percentage}
                onChangeText={(v) => updateRow(row.id, 'percentage', v)}
              />
            </View>
            {rows.length > MIN_GROUPS && (
              <Pressable onPress={() => removeRow(row.id)} style={{ paddingBottom: Spacing.two }}>
                <ThemedText themeColor="critical">✕</ThemedText>
              </Pressable>
            )}
          </View>
        ))}

        {rows.length < MAX_GROUPS && (
          <Pressable onPress={addRow}>
            <ThemedText type="linkPrimary">+ Agregar grupo ({rows.length}/{MAX_GROUPS})</ThemedText>
          </Pressable>
        )}

        <ThemedText themeColor={sum === 100 ? 'healthy' : 'critical'}>Suma actual: {sum}% (debe ser 100%)</ThemedText>
        <Pressable onPress={save}>
          <Card style={{ alignItems: 'center' }}>
            <ThemedText type="smallBold">Guardar regla</ThemedText>
          </Card>
        </Pressable>
      </Card>

      <Card style={{ gap: Spacing.one }}>
        <ThemedText type="smallBold">Reglas existentes</ThemedText>
        {rules.map((rule) => (
          <Pressable key={rule.id} onPress={() => activate(rule.id)}>
            <ThemedText themeColor={rule.isActive ? 'primary' : 'text'}>
              {rule.isActive ? '● ' : '○ '}
              {rule.name} ({rule.allocations.map((a) => `${a.label} ${a.percentage}%`).join(' / ')})
            </ThemedText>
          </Pressable>
        ))}
      </Card>
    </ScreenContainer>
  );
}
