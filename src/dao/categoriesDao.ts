import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { categories, expenses, income } from '@/db/schema';
import type { NewCategory } from '@/models';

export async function listCategories(movementType?: 'income' | 'expense') {
  const rows = await db.select().from(categories).where(eq(categories.isActive, true));
  return movementType ? rows.filter((c) => c.movementType === movementType) : rows;
}

export async function createCategory(input: NewCategory) {
  const [row] = await db.insert(categories).values(input).returning();
  return row;
}

export async function updateCategory(id: number, input: Partial<NewCategory>) {
  const [row] = await db.update(categories).set(input).where(eq(categories.id, id)).returning();
  return row;
}

export async function isCategoryInUse(id: number): Promise<boolean> {
  const [incomeRow] = await db.select({ id: income.id }).from(income).where(eq(income.categoryId, id)).limit(1);
  if (incomeRow) return true;
  const [expenseRow] = await db
    .select({ id: expenses.id })
    .from(expenses)
    .where(eq(expenses.categoryId, id))
    .limit(1);
  return Boolean(expenseRow);
}

export async function deleteCategory(id: number): Promise<{ deleted: boolean; reason?: string }> {
  if (await isCategoryInUse(id)) {
    return { deleted: false, reason: 'in_use' };
  }
  await db.delete(categories).where(eq(categories.id, id));
  return { deleted: true };
}
