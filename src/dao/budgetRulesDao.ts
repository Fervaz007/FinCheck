import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { budgetRuleAllocations, budgetRules, settings } from '@/db/schema';
import type { BudgetAllocation } from '@/services/financial/budget';
import { validateAllocationsSumTo100 } from '@/services/financial/budget';

export async function listBudgetRules() {
  const rules = await db.select().from(budgetRules);
  const allocations = await db.select().from(budgetRuleAllocations);
  return rules.map((rule) => ({
    ...rule,
    allocations: allocations.filter((a) => a.budgetRuleId === rule.id),
  }));
}

export async function getActiveBudgetRule() {
  const rules = await listBudgetRules();
  return rules.find((r) => r.isActive) ?? null;
}

export async function createBudgetRule(
  name: string,
  allocations: BudgetAllocation[],
  isCustom = true,
) {
  const { valid } = validateAllocationsSumTo100(allocations);
  if (!valid) {
    throw new Error('Allocation percentages must sum to 100%');
  }

  return db.transaction(async (tx) => {
    const [rule] = await tx.insert(budgetRules).values({ name, isCustom, isActive: false }).returning();
    await tx
      .insert(budgetRuleAllocations)
      .values(allocations.map((a) => ({ budgetRuleId: rule.id, label: a.label, percentage: a.percentage })));
    return rule;
  });
}

export async function activateBudgetRule(id: number) {
  await db.transaction(async (tx) => {
    await tx.update(budgetRules).set({ isActive: false });
    await tx.update(budgetRules).set({ isActive: true }).where(eq(budgetRules.id, id));

    const [existingSettings] = await tx.select().from(settings).limit(1);
    if (existingSettings) {
      await tx.update(settings).set({ activeBudgetRuleId: id }).where(eq(settings.id, existingSettings.id));
    } else {
      await tx.insert(settings).values({ activeBudgetRuleId: id });
    }
  });
}
