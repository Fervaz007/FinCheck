import { desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { simulations } from '@/db/schema';
import type { NewSimulation } from '@/models';

export async function listSimulations() {
  return db.select().from(simulations).orderBy(desc(simulations.createdAt));
}

export async function createSimulation(input: NewSimulation) {
  const [row] = await db.insert(simulations).values(input).returning();
  return row;
}

export async function deleteSimulation(id: number) {
  await db.delete(simulations).where(eq(simulations.id, id));
}
