import { and, eq, gte, lte, sql } from 'drizzle-orm';

import { db, type Database } from '@/db/client';
import { expenses } from '@/db/schema';
import type { NewExpense } from '@/models';

function monthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export async function listExpensesForMonth(year: number, month: number) {
  const { start, end } = monthRange(year, month);
  return db
    .select()
    .from(expenses)
    .where(and(gte(expenses.date, start), lte(expenses.date, end)));
}

/** All-time expense total, across every month — feeds the global "Disponible". */
export async function sumAllExpensesCents(database: Database = db): Promise<number> {
  const [row] = await database
    .select({ total: sql<number>`coalesce(sum(${expenses.amountCents}), 0)` })
    .from(expenses);
  return Number(row?.total ?? 0);
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
