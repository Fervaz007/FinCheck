import { eq } from 'drizzle-orm';

import { debtPayments, debts } from '@/db/schema';
import { createTestDb } from '@/test-utils/sqliteTestDb';

// Importing the DAO pulls in '@/db/client', whose top-level openDatabaseSync()
// call isn't mocked by jest-expo. Every call in this file passes its own
// in-memory `testDb` explicitly, so the real singleton is never touched.
jest.mock('@/db/client', () => ({ db: {}, getDb: () => ({}) }));

import {
  insertConfirmedPayment,
  sumAllConfirmedPaymentsCents,
  sumConfirmedPaymentsForDebtCents,
} from '../debtPaymentsDao';

describe('debtPaymentsDao (integration, sql.js in-memory db)', () => {
  it('insertConfirmedPayment writes an already-confirmed row', async () => {
    const testDb = await createTestDb();

    const [debt] = await testDb
      .insert(debts)
      .values({
        name: 'Despensa',
        debtType: 'general',
        originalAmountCents: 300_000,
        saldoPendienteCents: 300_000,
        monthlyPaymentCents: 300_000,
        startDate: '2026-10-02',
      })
      .returning();

    await insertConfirmedPayment(
      { debtId: debt.id, amountCents: 150_000, occurrenceDate: '2026-09-30' },
      testDb,
    );

    const rows = await testDb.select().from(debtPayments).where(eq(debtPayments.debtId, debt.id));
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe('confirmed');
    expect(rows[0].amountCents).toBe(150_000);
    expect(rows[0].confirmedAt).not.toBeNull();
  });

  it('sumAllConfirmedPaymentsCents totals only confirmed rows', async () => {
    const testDb = await createTestDb();

    const [debt] = await testDb
      .insert(debts)
      .values({
        name: 'Luz',
        debtType: 'general',
        originalAmountCents: 100_000,
        saldoPendienteCents: 100_000,
        monthlyPaymentCents: 100_000,
        startDate: '2026-10-01',
      })
      .returning();

    await insertConfirmedPayment({ debtId: debt.id, amountCents: 50_000, occurrenceDate: '2026-09-15' }, testDb);
    await insertConfirmedPayment({ debtId: debt.id, amountCents: 50_000, occurrenceDate: '2026-09-30' }, testDb);
    // A lingering scheduled row must be ignored by the confirmed-only total.
    await testDb
      .insert(debtPayments)
      .values({ debtId: debt.id, amountCents: 999_999, occurrenceDate: '2026-10-15', status: 'scheduled' });

    expect(await sumAllConfirmedPaymentsCents(testDb)).toBe(100_000);
    expect(await sumConfirmedPaymentsForDebtCents(debt.id, testDb)).toBe(100_000);
  });
});
