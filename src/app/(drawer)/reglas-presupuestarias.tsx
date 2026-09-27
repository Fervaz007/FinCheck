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
  label: string;
  percentage: string;
}

export default function ReglasPresupuestariasScreen() {
  const { rules, create, activate } = useBudgetRules();
  const [name, setName] = useState('');
  const [rows, setRows] = useState<Row[]>([
    { label: 'necesidades', percentage: '' },
    { label: 'deudas', percentage: '' },
    { label: 'ahorro', percentage: '' },
    { label: 'ocio', percentage: '' },
  ]);

  const sum = rows.reduce((acc, r) => acc + (Number(r.percentage) || 0), 0);

  const updateRow = (index: number, field: keyof Row, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

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
        {rows.map((row, index) => (
          <View key={index} style={{ flexDirection: 'row', gap: Spacing.two }}>
            <View style={{ flex: 2 }}>
              <FormField label="Grupo" value={row.label} onChangeText={(v) => updateRow(index, 'label', v)} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="%"
                keyboardType="number-pad"
                value={row.percentage}
                onChangeText={(v) => updateRow(index, 'percentage', v)}
              />
            </View>
          </View>
        ))}
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
