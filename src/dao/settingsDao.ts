import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { settings } from '@/db/schema';

export async function getSettings() {
  const [row] = await db.select().from(settings).limit(1);
  if (row) return row;
  const [created] = await db.insert(settings).values({}).returning();
  return created;
}

export async function updateDebtLimitPct(pct: number) {
  const current = await getSettings();
  const [row] = await db
    .update(settings)
    .set({ debtLimitPct: pct })
    .where(eq(settings.id, current.id))
    .returning();
  return row;
}
