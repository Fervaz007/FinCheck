import { addDays } from 'date-fns';
import { eq } from 'drizzle-orm';

import type { Database } from '@/db/client';
import { recurringTransactions } from '@/db/schema';

import { parseISODate } from '@/utils/date';

import { computeOccurrences } from './computeOccurrences';
import type { RecurrenceConfig } from './recurrenceTypes';

export interface ProjectedMovement {
  date: Date;
  description: string;
  amountCents: number;
  kind: 'income' | 'expense' | 'debt_payment';
}

/**
 * Read-only projection of movements that would occur between tomorrow and
 * `horizonDate`, for a given account. Never writes to the database — safe to
 * call as often as needed for a "saldo proyectado" view.
 */
export async function projectAccountMovements(
  db: Database,
  accountId: number,
  today: Date,
  horizonDate: Date,
): Promise<ProjectedMovement[]> {
  const activeRecurring = await db
    .select()
    .from(recurringTransactions)
    .where(eq(recurringTransactions.isActive, true));

  const from = addDays(today, 1);
  const movements: ProjectedMovement[] = [];

  for (const rt of activeRecurring) {
    if (rt.accountId !== accountId) continue;

    const config = rt.recurrenceConfig as RecurrenceConfig;
    const anchor = parseISODate(rt.anchorDate);
    const occurrences = computeOccurrences(config, anchor, from, horizonDate);

    for (const date of occurrences) {
      movements.push({
        date,
        description: rt.description,
        amountCents: rt.kind === 'income' ? rt.amountCents : -rt.amountCents,
        kind: rt.kind as ProjectedMovement['kind'],
      });
    }
  }

  return movements.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function sumProjectedMovements(movements: ProjectedMovement[]): number {
  return movements.reduce((sum, m) => sum + m.amountCents, 0);
}
