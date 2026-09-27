import { accounts, expenses, income, recurringTransactions } from '@/db/schema';

import { createTestDb } from '@/test-utils/sqliteTestDb';

import { runReconciliation } from '../reconciliation';

describe('runReconciliation (integration, sql.js in-memory db)', () => {
  it('generates exactly the expected occurrences after being closed across a month boundary', async () => {
    const db = await createTestDb();

    const [account] = await db
      .insert(accounts)
      .values({ name: 'BBVA', type: 'banco', initialBalanceCents: 300_000 })
      .returning({ id: accounts.id });

    await db.insert(recurringTransactions).values({
      kind: 'income',
      description: 'Sueldo',
      accountId: account.id,
      amountCents: 490_000,
      recurrenceType: 'SEMIMONTHLY_FIXED',
      recurrenceConfig: { type: 'SEMIMONTHLY_FIXED', dayA: 15, dayB: 'last' },
      anchorDate: '2026-09-01',
    });

    await runReconciliation(db, new Date(2026, 9, 1)); // 1-oct-2026

    const rows = await db.select().from(income);
    const dates = rows.map((r) => r.occurrenceDate).sort();

    expect(dates).toEqual(['2026-09-15', '2026-09-30']);
    expect(rows.every((r) => r.amountCents === 490_000)).toBe(true);
  });

  it('does not duplicate movements when reconciliation runs twice for the same date', async () => {
    const db = await createTestDb();

    const [account] = await db
      .insert(accounts)
      .values({ name: 'Efectivo', type: 'efectivo', initialBalanceCents: 0 })
      .returning({ id: accounts.id });

    await db.insert(recurringTransactions).values({
      kind: 'expense',
      description: 'Internet',
      accountId: account.id,
      amountCents: 60_000,
      recurrenceType: 'MONTHLY_DAY',
      recurrenceConfig: { type: 'MONTHLY_DAY', day: 10 },
      anchorDate: '2026-09-01',
    });

    const today = new Date(2026, 9, 12); // 12-oct-2026

    await runReconciliation(db, today);
    await runReconciliation(db, today);

    const rows = await db.select().from(expenses);

    expect(rows.length).toBe(2); // 10-sep and 10-oct, not duplicated
    expect(rows.map((r) => r.occurrenceDate).sort()).toEqual(['2026-09-10', '2026-10-10']);
  });
});
