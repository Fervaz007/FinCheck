import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { monthlySummaries } from '@/db/schema';

export interface MonthlySummaryInput {
  year: number;
  month: number;
  incomeTotalCents: number;
  expenseTotalCents: number;
  debtPaymentTotalCents: number;
  savingsTotalCents: number;
  availableCents: number;
  budgetRuleIdSnapshot?: number | null;
  debtLimitPctSnapshot?: number | null;
  healthStatusSnapshot?: string | null;
}

export async function getMonthlySummary(year: number, month: number) {
  const [row] = await db
    .select()
    .from(monthlySummaries)
    .where(and(eq(monthlySummaries.year, year), eq(monthlySummaries.month, month)));
  return row ?? null;
}

export async function listMonthlySummaries() {
  return db.select().from(monthlySummaries).orderBy(desc(monthlySummaries.year), desc(monthlySummaries.month));
}

export async function upsertMonthlySummary(input: MonthlySummaryInput) {
  const [row] = await db
    .insert(monthlySummaries)
    .values(input)
    .onConflictDoUpdate({
      target: [monthlySummaries.year, monthlySummaries.month],
      set: {
        incomeTotalCents: input.incomeTotalCents,
        expenseTotalCents: input.expenseTotalCents,
        debtPaymentTotalCents: input.debtPaymentTotalCents,
        savingsTotalCents: input.savingsTotalCents,
        availableCents: input.availableCents,
        budgetRuleIdSnapshot: input.budgetRuleIdSnapshot,
        debtLimitPctSnapshot: input.debtLimitPctSnapshot,
        healthStatusSnapshot: input.healthStatusSnapshot,
      },
    })
    .returning();
  return row;
}
