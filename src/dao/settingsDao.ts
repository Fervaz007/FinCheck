import { db } from '@/db/client';
import { settings } from '@/db/schema';

export async function getSettings() {
  const [row] = await db.select().from(settings).limit(1);
  if (row) return row;
  const [created] = await db.insert(settings).values({}).returning();
  return created;
}
