import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
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
  isMonitored: boolean;
}

interface RuleLike {
  id: number;
  name: string;
  allocations: { label: string; percentage: number; isMonitored: boolean }[];
}

const MIN_GROUPS = 1;
const MAX_GROUPS = 5;

let nextRowId = 0;
const makeRow = (label = '', percentage = '', isMonitored = false): Row => ({
  id: nextRowId++,
  label,
  percentage,
  isMonitored,
});

const defaultRows = () => [makeRow('necesidades'), makeRow('deudas'), makeRow('ahorro')];

export default function ReglasPresupuestariasScreen() {
  const { rules, create, update, remove, activate } = useBudgetRules();
  const [name, setName] = useState('');
  const [rows, setRows] = useState<Row[]>(defaultRows);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);

  const sum = rows.reduce((acc, r) => acc + (Number(r.percentage) || 0), 0);

  const updateRow = (id: number, field: 'label' | 'percentage', value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const toggleMonitored = (id: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isMonitored: !r.isMonitored } : r)));
  };

  const addRow = () => setRows((prev) => (prev.length < MAX_GROUPS ? [...prev, makeRow()] : prev));
  const removeRow = (id: number) =>
    setRows((prev) => (prev.length > MIN_GROUPS ? prev.filter((r) => r.id !== id) : prev));

  const resetForm = () => {
    setName('');
    setRows(defaultRows());
    setEditingRuleId(null);
  };

  const startEditing = (rule: RuleLike) => {
    setName(rule.name);
    setRows(rule.allocations.map((a) => makeRow(a.label, String(a.percentage), a.isMonitored)));
    setEditingRuleId(rule.id);
  };

  const save = async () => {
    const allocations = rows
      .filter((r) => r.label.trim() && r.percentage.trim())
      .map((r) => ({ label: r.label.trim(), percentage: Number(r.percentage), isMonitored: r.isMonitored }));

    const { valid, sum: total } = validateAllocationsSumTo100(allocations);
    if (!valid) {
      Alert.alert('La suma debe ser 100%', `Actualmente suma ${total}%.`);
      return;
    }
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Dale un nombre a tu regla personalizada.');
      return;
    }

    if (editingRuleId != null) {
      await update(editingRuleId, name.trim(), allocations);
      resetForm();
      Alert.alert('Guardada', 'Los cambios a tu regla se guardaron.');
    } else {
      await create(name.trim(), allocations, true);
      resetForm();
      Alert.alert('Guardada', 'Tu regla personalizada fue creada. Actívala desde Presupuesto.');
    }
  };

  const handleDelete = (rule: RuleLike) => {
    Alert.alert('Eliminar regla', `¿Eliminar la regla "${rule.name}"? Esto no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(rule.id);
            if (editingRuleId === rule.id) resetForm();
          } catch (error) {
            Alert.alert('No se pudo eliminar', error instanceof Error ? error.message : String(error));
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ThemedText type="title">Reglas presupuestarias</ThemedText>

      <Card style={{ gap: Spacing.three }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="heading">
            {editingRuleId != null ? 'Editar regla' : 'Nueva regla personalizada'}
          </ThemedText>
          {editingRuleId != null && (
            <Pressable onPress={resetForm}>
              <ThemedText type="small" themeColor="textSecondary">Cancelar edición</ThemedText>
            </Pressable>
          )}
        </View>
        <FormField label="Nombre" value={name} onChangeText={setName} />
        {rows.map((row) => (
          <Card key={row.id} elevated style={{ gap: Spacing.two }}>
            <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-end' }}>
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
                <Pressable hitSlop={8} onPress={() => removeRow(row.id)} style={{ paddingBottom: Spacing.three }}>
                  <ThemedText themeColor="critical">✕</ThemedText>
                </Pressable>
              )}
            </View>
            <Pressable onPress={() => toggleMonitored(row.id)}>
              <ThemedText type="small" themeColor={row.isMonitored ? 'primary' : 'textSecondary'}>
                {row.isMonitored ? '☑ ' : '☐ '}
                Monitorear este grupo
              </ThemedText>
            </Pressable>
          </Card>
        ))}

        {rows.length < MAX_GROUPS && (
          <Pressable onPress={addRow}>
            <ThemedText type="linkPrimary">+ Agregar grupo ({rows.length}/{MAX_GROUPS})</ThemedText>
          </Pressable>
        )}

        <ThemedText themeColor={sum === 100 ? 'healthy' : 'critical'}>Suma actual: {sum}% (debe ser 100%)</ThemedText>
        <Button label={editingRuleId != null ? 'Guardar cambios' : 'Guardar regla'} onPress={save} />
      </Card>

      <View style={{ gap: Spacing.three }}>
        <ThemedText type="heading">Reglas existentes</ThemedText>
        {rules.map((rule) => (
          <Card key={rule.id} style={{ gap: Spacing.two }}>
            <Pressable
              onPress={() => !rule.isActive && activate(rule.id)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <ThemedText type="heading" themeColor={rule.isActive ? 'primary' : 'text'}>
                {rule.isActive ? '● ' : '○ '}
                {rule.name}
              </ThemedText>
              {!rule.isActive && <ThemedText type="caption" themeColor="textSecondary">Tocar para activar</ThemedText>}
            </Pressable>
            <View style={{ gap: Spacing.one }}>
              {rule.allocations.map((a) => (
                <View key={a.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {a.label}
                    {a.isMonitored ? ' (monitoreado)' : ''}
                  </ThemedText>
                  <ThemedText type="small">{a.percentage}%</ThemedText>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.three }}>
              <Button
                label="Editar"
                variant="secondary"
                onPress={() => startEditing(rule)}
                style={{ flex: 1, minHeight: 40 }}
              />
              <Button
                label="Eliminar"
                variant="destructive"
                onPress={() => handleDelete(rule)}
                style={{ flex: 1, minHeight: 40 }}
              />
            </View>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}
