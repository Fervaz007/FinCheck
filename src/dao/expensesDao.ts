import { and, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/db/client';
import { expenses } from '@/db/schema';
import type { NewExpense } from '@/models';

function monthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export async function listExpensesForMonth(year: number, month: number, categoryId?: number) {
  const { start, end } = monthRange(year, month);
  const rows = await db
    .select()
    .from(expenses)
    .where(and(gte(expenses.date, start), lte(expenses.date, end)));
  return categoryId ? rows.filter((e) => e.categoryId === categoryId) : rows;
}

export async function createExpense(input: NewExpense) {
  const [row] = await db.insert(expenses).values(input).returning();
  return row;
}

export async function updateExpense(id: number, input: Partial<NewExpense>) {
  const [row] = await db.update(expenses).set(input).where(eq(expenses.id, id)).returning();
  return row;
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
}

export async function sumExpensesByCategoryForMonth(
  year: number,
  month: number,
): Promise<Record<number, number>> {
  const rows = await listExpensesForMonth(year, month);
  return rows.reduce<Record<number, number>>((acc, row) => {
    if (row.categoryId == null) return acc;
    acc[row.categoryId] = (acc[row.categoryId] ?? 0) + row.amountCents;
    return acc;
  }, {});
}
