import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { Card } from '@/components/Card';
import { ChipSelect } from '@/components/ChipSelect';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { useCategories } from '@/hooks/useCategories';
import { Spacing } from '@/theme';

interface CategoryFormValues {
  name: string;
  movementType: 'income' | 'expense';
  budgetGroup: string;
}

export default function CategoriasScreen() {
  const { categories, create, remove } = useCategories();
  const { control, handleSubmit, reset } = useForm<CategoryFormValues>({
    defaultValues: { name: '', movementType: 'expense', budgetGroup: 'necesidades' },
  });

  const submit = handleSubmit(async (values) => {
    await create(values);
    reset({ name: '', movementType: values.movementType, budgetGroup: values.budgetGroup });
  });

  return (
    <ScreenContainer>
      <ThemedText type="title">Categorías</ThemedText>

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
              options={[
                { label: 'Necesidades', value: 'necesidades' },
                { label: 'Ocio', value: 'ocio' },
                { label: 'Deudas', value: 'deudas' },
                { label: 'Ahorro', value: 'ahorro' },
              ]}
            />
          )}
        />
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
