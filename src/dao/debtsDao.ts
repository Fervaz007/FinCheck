import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { debts } from '@/db/schema';
import type { NewDebt } from '@/models';

export async function listDebts() {
  return db.select().from(debts);
}

export async function getDebt(id: number) {
  const [row] = await db.select().from(debts).where(eq(debts.id, id));
  return row;
}

export async function createDebt(input: NewDebt) {
  const [row] = await db.insert(debts).values(input).returning();
  return row;
}

export async function updateDebt(id: number, input: Partial<NewDebt>) {
  const [row] = await db.update(debts).set(input).where(eq(debts.id, id)).returning();
  return row;
}

export async function deleteDebt(id: number) {
  await db.delete(debts).where(eq(debts.id, id));
}
