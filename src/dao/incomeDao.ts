import { and, eq, gte, lte, sql } from 'drizzle-orm';

import { db, type Database } from '@/db/client';
import { income } from '@/db/schema';
import type { NewIncome } from '@/models';

function monthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export async function listIncomeForMonth(year: number, month: number) {
  const { start, end } = monthRange(year, month);
  return db.select().from(income).where(and(gte(income.date, start), lte(income.date, end)));
}

/** All-time income total, across every month — feeds the global "Disponible". */
export async function sumAllIncomeCents(database: Database = db): Promise<number> {
  const [row] = await database
    .select({ total: sql<number>`coalesce(sum(${income.amountCents}), 0)` })
    .from(income);
  return Number(row?.total ?? 0);
}

export async function createIncome(input: NewIncome) {
  const [row] = await db.insert(income).values(input).returning();
  return row;
}

export async function updateIncome(id: number, input: Partial<NewIncome>) {
  const [row] = await db.update(income).set(input).where(eq(income.id, id)).returning();
  return row;
}

export async function deleteIncome(id: number) {
  await db.delete(income).where(eq(income.id, id));
}
