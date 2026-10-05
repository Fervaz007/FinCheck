import { debtPayments, debts, expenses, income } from '@/db/schema';
import { createTestDb } from '@/test-utils/sqliteTestDb';

// See debtPaymentsDao.integration.test.ts: importing a DAO pulls in '@/db/client',
// whose top-level openDatabaseSync() isn't mocked by jest-expo. Every call here
// passes its own in-memory testDb, so the real singleton is never touched.
jest.mock('@/db/client', () => ({ db: {}, getDb: () => ({}) }));

import { sumAllConfirmedPaymentsCents } from '../debtPaymentsDao';
import { sumAllExpensesCents } from '../expensesDao';
import { sumAllIncomeCents } from '../incomeDao';

describe('global available sums (month-independent)', () => {
  it('sums income and expenses across every month, and only confirmed debt payments', async () => {
    const testDb = await createTestDb();

    // Income spanning two different months — both must count.
    await testDb.insert(income).values([
      { description: 'Nómina sep', amountCents: 500_000, date: '2026-09-15' },
      { description: 'Extra oct', amountCents: 150_000, date: '2026-10-03' },
    ]);

    await testDb.insert(expenses).values([
      { description: 'Súper sep', amountCents: 80_000, date: '2026-09-20' },
      { description: 'Gas oct', amountCents: 20_000, date: '2026-10-05' },
    ]);

    const [debt] = await testDb
      .insert(debts)
      .values({
        name: 'Luz',
        debtType: 'general',
        originalAmountCents: 100_000,
        saldoPendienteCents: 100_000,
        monthlyPaymentCents: 100_000,
        startDate: '2026-09-01',
      })
      .returning();

    await testDb.insert(debtPayments).values([
      // Confirmed in September — counts.
      { debtId: debt.id, amountCents: 100_000, occurrenceDate: '2026-09-15', status: 'confirmed' },
      // Scheduled (not yet paid) — must NOT count toward money already spent.
      { debtId: debt.id, amountCents: 100_000, occurrenceDate: '2026-10-15', status: 'scheduled' },
    ]);

    const allIncome = await sumAllIncomeCents(testDb);
    const allExpenses = await sumAllExpensesCents(testDb);
    const allConfirmed = await sumAllConfirmedPaymentsCents(testDb);

    expect(allIncome).toBe(650_000); // both months
    expect(allExpenses).toBe(100_000); // both months
    expect(allConfirmed).toBe(100_000); // confirmed only, scheduled excluded

    const globalAvailableCents = allIncome - allExpenses - allConfirmed;
    expect(globalAvailableCents).toBe(450_000);
  });

  it('returns 0 for empty tables', async () => {
    const testDb = await createTestDb();
    expect(await sumAllIncomeCents(testDb)).toBe(0);
    expect(await sumAllExpensesCents(testDb)).toBe(0);
    expect(await sumAllConfirmedPaymentsCents(testDb)).toBe(0);
  });
});
