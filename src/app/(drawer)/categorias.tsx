import { useMemo } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { Card } from '@/components/Card';
import { ChipSelect } from '@/components/ChipSelect';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useBudgetRules } from '@/hooks/useBudgetRules';
import { useCategories } from '@/hooks/useCategories';
import { Spacing } from '@/theme';

const DEFAULT_GROUPS = ['necesidades', 'ocio', 'deudas', 'ahorro'];

interface CategoryFormValues {
  name: string;
  movementType: 'income' | 'expense';
  budgetGroup: string;
  newBudgetGroup: string;
}

export default function CategoriasScreen() {
  const { categories, create, remove } = useCategories();
  const { rules } = useBudgetRules();
  const { control, handleSubmit, watch, reset } = useForm<CategoryFormValues>({
    defaultValues: { name: '', movementType: 'expense', budgetGroup: 'necesidades', newBudgetGroup: '' },
  });

  const groupOptions = useMemo(() => {
    const fromCategories = categories.map((c) => c.budgetGroup);
    const fromRules = rules.flatMap((r) => r.allocations.map((a) => a.label));
    const all = new Set([...DEFAULT_GROUPS, ...fromCategories, ...fromRules]);
    return Array.from(all).map((g) => ({ label: g, value: g }));
  }, [categories, rules]);

  const newBudgetGroup = watch('newBudgetGroup');

  const submit = handleSubmit(async (values) => {
    const budgetGroup = values.newBudgetGroup.trim() || values.budgetGroup;
    await create({ name: values.name, movementType: values.movementType, budgetGroup });
    reset({ name: '', movementType: values.movementType, budgetGroup, newBudgetGroup: '' });
  });

  return (
    <ScreenContainer>
      <ThemedText type="title">Categorías</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        El grupo de presupuesto no está limitado a 4 — puedes usar los que ya existen o escribir uno
        nuevo (hasta 5 por regla de presupuesto, ver "Reglas presupuestarias").
      </ThemedText>

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
          name="movementType"
          render={({ field }) => (
            <ChipSelect
              label="Tipo"
              value={field.value}
              onChange={field.onChange}
              options={[
                { label: 'Egreso', value: 'expense' },
                { label: 'Ingreso', value: 'income' },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="budgetGroup"
          render={({ field }) => (
            <ChipSelect
              label="Grupo de presupuesto"
              value={field.value}
              onChange={field.onChange}
              options={groupOptions}
            />
          )}
        />
        <Controller
          control={control}
          name="newBudgetGroup"
          render={({ field }) => (
            <FormField
              label="O escribe un grupo nuevo (opcional)"
              placeholder="ej. transporte"
              value={field.value}
              onChangeText={field.onChange}
            />
          )}
        />
        {newBudgetGroup.trim() ? (
          <ThemedText type="small" themeColor="textSecondary">
            Se guardará con el grupo "{newBudgetGroup.trim()}"
          </ThemedText>
        ) : null}
        <Pressable onPress={submit}>
          <Card style={{ alignItems: 'center' }}>
            <ThemedText type="smallBold">+ Agregar categoría</ThemedText>
          </Card>
        </Pressable>
      </Card>

      {categories.length === 0 ? (
        <EmptyState message="Sin categorías todavía." />
      ) : (
        categories.map((cat) => (
          <Card key={cat.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <ThemedText type="smallBold">{cat.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {cat.movementType === 'income' ? 'Ingreso' : 'Egreso'} · {cat.budgetGroup}
              </ThemedText>
            </View>
            <Pressable
              onPress={async () => {
                const result = await remove(cat.id);
                if (!result.deleted) {
                  Alert.alert('No se puede eliminar', 'Esta categoría ya tiene movimientos registrados. Reasígnalos primero.');
                }
              }}
            >
              <ThemedText themeColor="critical">✕</ThemedText>
            </Pressable>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}
