import { eq } from 'drizzle-orm';

import { debtPayments, debts } from '@/db/schema';
import { createTestDb } from '@/test-utils/sqliteTestDb';

// Importing the DAO pulls in '@/db/client', whose top-level openDatabaseSync()
// call isn't mocked by jest-expo. Every call in this file passes its own
// in-memory `testDb` explicitly, so the real singleton is never touched.
jest.mock('@/db/client', () => ({ db: {}, getDb: () => ({}) }));

import { confirmPayment } from '../debtPaymentsDao';

describe('confirmPayment (integration, sql.js in-memory db) — parent/child debt cascade', () => {
  it('decrements only remaining_payments on countdown children, leaves indefinite children untouched', async () => {
    const testDb = await createTestDb();

    const [bbva] = await testDb
      .insert(debts)
      .values({
        name: 'BBVA',
        debtType: 'tarjeta_credito',
        originalAmountCents: 0,
        saldoPendienteCents: 0,
        monthlyPaymentCents: 0,
        startDate: '2026-01-01',
      })
      .returning();

    const [llantas] = await testDb
      .insert(debts)
      .values({
        name: 'Llantas',
        parentDebtId: bbva.id,
        debtType: 'msi',
        originalAmountCents: 360_000,
        saldoPendienteCents: 360_000,
        monthlyPaymentCents: 30_000,
        remainingPayments: 1, // about to finish
        startDate: '2026-01-01',
      })
      .returning();

    const [tv] = await testDb
      .insert(debts)
      .values({
        name: 'TV',
        parentDebtId: bbva.id,
        debtType: 'msi',
        originalAmountCents: 60_000,
        saldoPendienteCents: 60_000,
        monthlyPaymentCents: 20_000,
        remainingPayments: 3,
        startDate: '2026-01-01',
      })
      .returning();

    const [netflix] = await testDb
      .insert(debts)
      .values({
        name: 'Netflix',
        parentDebtId: bbva.id,
        debtType: 'suscripcion',
        originalAmountCents: 20_000,
        saldoPendienteCents: 20_000,
        monthlyPaymentCents: 20_000,
        remainingPayments: null, // indefinite
        startDate: '2026-01-01',
      })
      .returning();

    const [payment] = await testDb
      .insert(debtPayments)
      .values({
        debtId: bbva.id,
        amountCents: 70_000,
        occurrenceDate: '2026-01-25',
        status: 'scheduled',
      })
      .returning();

    await confirmPayment(payment.id, undefined, testDb);

    const [updatedLlantas] = await testDb.select().from(debts).where(eq(debts.id, llantas.id));
    const [updatedTv] = await testDb.select().from(debts).where(eq(debts.id, tv.id));
    const [updatedNetflix] = await testDb.select().from(debts).where(eq(debts.id, netflix.id));
    const [updatedPayment] = await testDb.select().from(debtPayments).where(eq(debtPayments.id, payment.id));

    expect(updatedLlantas.remainingPayments).toBe(0);
    expect(updatedLlantas.status).toBe('pagada');
    // No dollar amount subtracted from a child — its saldo is derived, not stored/decremented.
    expect(updatedLlantas.saldoPendienteCents).toBe(360_000);

    expect(updatedTv.remainingPayments).toBe(2);
    expect(updatedTv.status).toBe('activa');

    expect(updatedNetflix.remainingPayments).toBeNull();
    expect(updatedNetflix.status).toBe('activa');

    expect(updatedPayment.status).toBe('confirmed');
  });

  it('marks the parent paid once every countdown child finishes and none are indefinite', async () => {
    const testDb = await createTestDb();

    const [prestamo] = await testDb
      .insert(debts)
      .values({
        name: 'Préstamo compartido',
        debtType: 'prestamo',
        originalAmountCents: 0,
        saldoPendienteCents: 0,
        monthlyPaymentCents: 0,
        startDate: '2026-01-01',
      })
      .returning();

    await testDb.insert(debts).values({
      name: 'Última parte',
      parentDebtId: prestamo.id,
      debtType: 'msi',
      originalAmountCents: 10_000,
      saldoPendienteCents: 10_000,
      monthlyPaymentCents: 10_000,
      remainingPayments: 1,
      startDate: '2026-01-01',
    });

    const [payment] = await testDb
      .insert(debtPayments)
      .values({
        debtId: prestamo.id,
        amountCents: 10_000,
        occurrenceDate: '2026-01-25',
        status: 'scheduled',
      })
      .returning();

    await confirmPayment(payment.id, undefined, testDb);

    const [updatedParent] = await testDb.select().from(debts).where(eq(debts.id, prestamo.id));
    expect(updatedParent.status).toBe('pagada');
  });

  it('leaves ungrouped debts (no children) behaving exactly as before', async () => {
    const testDb = await createTestDb();

    const [loan] = await testDb
      .insert(debts)
      .values({
        name: 'Préstamo personal',
        debtType: 'prestamo',
        originalAmountCents: 300_000,
        saldoPendienteCents: 50_000,
        monthlyPaymentCents: 50_000,
        remainingPayments: 1,
        startDate: '2026-01-01',
      })
      .returning();

    const [payment] = await testDb
      .insert(debtPayments)
      .values({
        debtId: loan.id,
        amountCents: 50_000,
        occurrenceDate: '2026-01-15',
        status: 'scheduled',
      })
      .returning();

    await confirmPayment(payment.id, undefined, testDb);

    const [updatedLoan] = await testDb.select().from(debts).where(eq(debts.id, loan.id));
    expect(updatedLoan.saldoPendienteCents).toBe(0);
    expect(updatedLoan.remainingPayments).toBe(0);
    expect(updatedLoan.status).toBe('pagada');
  });
});
