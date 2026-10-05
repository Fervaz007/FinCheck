import {
  budgetRuleAllocations,
  budgetRules,
  debtPayments,
  debts,
  expenses,
  income,
  monthlySummaries,
  recurrenceOccurrences,
  recurringTransactions,
  settings,
  simulations,
} from '@/db/schema';
import { createTestDb } from '@/test-utils/sqliteTestDb';

// See debtPaymentsDao.integration.test.ts for why '@/db/client' is mocked.
jest.mock('@/db/client', () => ({ db: {}, getDb: () => ({}) }));

import { resetAllData } from '../reset';

describe('resetAllData (integration)', () => {
  it('empties every user table', async () => {
    const testDb = await createTestDb();

    const [rule] = await testDb.insert(budgetRules).values({ name: 'Regla' }).returning();
    await testDb
      .insert(budgetRuleAllocations)
      .values({ budgetRuleId: rule.id, label: 'necesidades', percentage: 100, isMonitored: true });

    const [debt] = await testDb
      .insert(debts)
      .values({
        name: 'BBVA',
        debtType: 'general',
        originalAmountCents: 100_000,
        saldoPendienteCents: 100_000,
        monthlyPaymentCents: 100_000,
        startDate: '2026-01-01',
        isParent: true,
      })
      .returning();

    // Child debt — exercises the children-before-parents delete pass.
    await testDb.insert(debts).values({
      name: 'Netflix',
      parentDebtId: debt.id,
      debtType: 'general',
      originalAmountCents: 20_000,
      saldoPendienteCents: 20_000,
      monthlyPaymentCents: 20_000,
      startDate: '2026-01-01',
    });

    const [rt] = await testDb
      .insert(recurringTransactions)
      .values({
        kind: 'income',
        description: 'Nómina',
        amountCents: 500_000,
        recurrenceType: 'MONTHLY_DAY',
        recurrenceConfig: { type: 'MONTHLY_DAY', day: 1 },
        anchorDate: '2026-01-01',
      })
      .returning();

    await testDb.insert(debtPayments).values({ debtId: debt.id, amountCents: 100_000, occurrenceDate: '2026-01-15' });
    await testDb.insert(income).values({ description: 'i', amountCents: 500_000, date: '2026-01-01' });
    await testDb.insert(expenses).values({ description: 'e', amountCents: 20_000, date: '2026-01-02' });
    await testDb
      .insert(recurrenceOccurrences)
      .values({ recurringTransactionId: rt.id, occurrenceDate: '2026-01-01', generatedEntityType: 'income', generatedEntityId: 1 });
    await testDb.insert(settings).values({ currency: 'MXN' });
    await testDb
      .insert(simulations)
      .values({ name: 'Celular', priceCents: 1_000_000, financedAmountCents: 1_000_000, monthlyPaymentCents: 100_000, termMonths: 12 });
    await testDb.insert(monthlySummaries).values({
      year: 2026,
      month: 1,
      incomeTotalCents: 500_000,
      expenseTotalCents: 20_000,
      debtPaymentTotalCents: 100_000,
      savingsTotalCents: 0,
      availableCents: 380_000,
    });

    await resetAllData(testDb);

    const tables = [
      budgetRules,
      budgetRuleAllocations,
      debts,
      recurringTransactions,
      debtPayments,
      income,
      expenses,
      recurrenceOccurrences,
      settings,
      simulations,
      monthlySummaries,
    ];
    for (const table of tables) {
      const rows = await testDb.select().from(table);
      expect(rows.length).toBe(0);
    }
  });
});
