import { useCallback, useEffect, useState } from 'react';

import { createCategory, deleteCategory, listCategories, updateCategory } from '@/dao/categoriesDao';
import type { Category, NewCategory } from '@/models';

export function useCategories(movementType?: 'income' | 'expense') {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await listCategories(movementType));
    } finally {
      setLoading(false);
    }
  }, [movementType]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    categories,
    loading,
    refresh,
    create: async (input: NewCategory) => {
      await createCategory(input);
      await refresh();
    },
    update: async (id: number, input: Partial<NewCategory>) => {
      await updateCategory(id, input);
      await refresh();
    },
    remove: async (id: number) => {
      const result = await deleteCategory(id);
      await refresh();
      return result;
    },
  };
}
