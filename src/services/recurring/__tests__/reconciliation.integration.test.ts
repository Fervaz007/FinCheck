import { eq } from 'drizzle-orm';

import { debtPayments, debts, expenses, income, recurringTransactions } from '@/db/schema';

import { createTestDb } from '@/test-utils/sqliteTestDb';

import { runReconciliation } from '../reconciliation';

describe('runReconciliation (integration, sql.js in-memory db)', () => {
  it('generates exactly the expected occurrences after being closed across a month boundary', async () => {
    const db = await createTestDb();

    await db.insert(recurringTransactions).values({
      kind: 'income',
      description: 'Sueldo',
      origin: 'Banco',
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

    await db.insert(recurringTransactions).values({
      kind: 'expense',
      description: 'Internet',
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

  it('auto-deducts the current quincena immediately when a recurring debt is created mid-period', async () => {
    const db = await createTestDb();

    // Despensa: $3,000 mensual -> $1,500 per quincena. Created Oct 2 (after the
    // Sep 30 cutoff), no reserveLastAccrualDate yet.
    const [debt] = await db
      .insert(debts)
      .values({
        name: 'Despensa',
        debtType: 'general',
        originalAmountCents: 300_000,
        saldoPendienteCents: 300_000,
        monthlyPaymentCents: 300_000,
        startDate: '2026-10-02',
        isRecurring: true,
        periodicity: 'mensual',
      })
      .returning();

    await runReconciliation(db, new Date(2026, 9, 2)); // 2-oct-2026

    const payments = await db.select().from(debtPayments).where(eq(debtPayments.debtId, debt.id));
    expect(payments.length).toBe(1);
    expect(payments[0].amountCents).toBe(150_000);
    expect(payments[0].occurrenceDate).toBe('2026-09-30');
    expect(payments[0].status).toBe('confirmed');

    const [updated] = await db.select().from(debts).where(eq(debts.id, debt.id));
    expect(updated.reserveLastAccrualDate).toBe('2026-09-30');

    // Running again the same day must not double-generate.
    await runReconciliation(db, new Date(2026, 9, 2));
    const after = await db.select().from(debtPayments).where(eq(debtPayments.debtId, debt.id));
    expect(after.length).toBe(1);
  });

  it('offsets the first deduction by the starting reserve (apartado inicial)', async () => {
    const db = await createTestDb();

    // Quincena share $1,500; apartado inicial $1,000 already set aside -> only $500 deducted.
    const [debt] = await db
      .insert(debts)
      .values({
        name: 'Despensa',
        debtType: 'general',
        originalAmountCents: 300_000,
        saldoPendienteCents: 300_000,
        monthlyPaymentCents: 300_000,
        startDate: '2026-10-02',
        isRecurring: true,
        periodicity: 'mensual',
        reserveAccumulatedCents: 100_000,
      })
      .returning();

    await runReconciliation(db, new Date(2026, 9, 2));

    const payments = await db.select().from(debtPayments).where(eq(debtPayments.debtId, debt.id));
    expect(payments.length).toBe(1);
    expect(payments[0].amountCents).toBe(50_000);

    const [updated] = await db.select().from(debts).where(eq(debts.id, debt.id));
    expect(updated.reserveAccumulatedCents).toBe(0); // buffer fully consumed
  });

  it('a reserve larger than one quincena fully covers the first cutoff and carries over', async () => {
    const db = await createTestDb();

    const [debt] = await db
      .insert(debts)
      .values({
        name: 'Despensa',
        debtType: 'general',
        originalAmountCents: 300_000,
        saldoPendienteCents: 300_000,
        monthlyPaymentCents: 300_000,
        startDate: '2026-10-02',
        isRecurring: true,
        periodicity: 'mensual',
        reserveAccumulatedCents: 200_000, // > one quincena ($1,500)
      })
      .returning();

    await runReconciliation(db, new Date(2026, 9, 2)); // one cutoff (Sep 30)

    const payments = await db.select().from(debtPayments).where(eq(debtPayments.debtId, debt.id));
    expect(payments.length).toBe(0); // fully covered, nothing deducted

    const [updated] = await db.select().from(debts).where(eq(debts.id, debt.id));
    expect(updated.reserveAccumulatedCents).toBe(50_000); // $2,000 - $1,500 left
  });

  it('catches up every passed cutoff since the debt started', async () => {
    const db = await createTestDb();

    // Created Sep 16 (period in progress began Sep 15); by Oct 1 the Sep 15 and
    // Sep 30 cutoffs have passed -> two deductions.
    const [debt] = await db
      .insert(debts)
      .values({
        name: 'Despensa',
        debtType: 'general',
        originalAmountCents: 300_000,
        saldoPendienteCents: 300_000,
        monthlyPaymentCents: 300_000,
        startDate: '2026-09-16',
        isRecurring: true,
        periodicity: 'mensual',
      })
      .returning();

    await runReconciliation(db, new Date(2026, 9, 1)); // 1-oct-2026

    const payments = await db.select().from(debtPayments).where(eq(debtPayments.debtId, debt.id));
    expect(payments.map((p) => p.occurrenceDate).sort()).toEqual(['2026-09-15', '2026-09-30']);
    expect(payments.every((p) => p.amountCents === 150_000)).toBe(true);
  });

  it('a parent debt deducts from its live children total; children and non-recurring debts do not self-generate', async () => {
    const db = await createTestDb();

    const [parent] = await db
      .insert(debts)
      .values({
        name: 'BBVA',
        debtType: 'tarjeta_credito',
        originalAmountCents: 0,
        saldoPendienteCents: 0,
        monthlyPaymentCents: 0,
        startDate: '2026-10-02',
        isParent: true,
        isRecurring: true,
        periodicity: 'mensual',
      })
      .returning();

    const [child] = await db
      .insert(debts)
      .values({
        name: 'Llantas',
        parentDebtId: parent.id,
        debtType: 'msi',
        originalAmountCents: 360_000,
        saldoPendienteCents: 360_000,
        monthlyPaymentCents: 30_000,
        remainingPayments: 12,
        startDate: '2026-10-02',
      })
      .returning();

    const [nonRecurring] = await db
      .insert(debts)
      .values({
        name: 'No recurrente',
        debtType: 'general',
        originalAmountCents: 50_000,
        saldoPendienteCents: 50_000,
        monthlyPaymentCents: 50_000,
        startDate: '2026-10-02',
        isRecurring: false,
      })
      .returning();

    await runReconciliation(db, new Date(2026, 9, 2)); // one cutoff (Sep 30)

    const all = await db.select().from(debtPayments);
    expect(all.length).toBe(1);
    expect(all[0].debtId).toBe(parent.id);
    // children total $300 (30_000 cents) mensual -> $150 (15_000 cents) per quincena
    expect(all[0].amountCents).toBe(15_000);

    // No rows generated for the child or the non-recurring debt by reconciliation.
    const childRows = await db.select().from(debtPayments).where(eq(debtPayments.debtId, child.id));
    const nonRecRows = await db.select().from(debtPayments).where(eq(debtPayments.debtId, nonRecurring.id));
    expect(childRows.length).toBe(0);
    expect(nonRecRows.length).toBe(0);
  });

  it('recurring income only adds to Disponible on an actual payday, not on a non-payday', async () => {
    const db = await createTestDb();

    await db.insert(recurringTransactions).values({
      kind: 'income',
      description: 'Nómina',
      amountCents: 500_000,
      recurrenceType: 'SEMIMONTHLY_FIXED',
      recurrenceConfig: { type: 'SEMIMONTHLY_FIXED', dayA: 15, dayB: 'last' },
      anchorDate: '2026-10-04', // registered on a non-cutoff day
    });

    // Same day it was registered (Oct 4): not a quincena cutoff -> no income row.
    await runReconciliation(db, new Date(2026, 9, 4));
    expect((await db.select().from(income)).length).toBe(0);

    // Reaching the next cutoff (Oct 15): the payday materializes.
    await runReconciliation(db, new Date(2026, 9, 15));
    const rows = await db.select().from(income);
    expect(rows.length).toBe(1);
    expect(rows[0].occurrenceDate).toBe('2026-10-15');
    expect(rows[0].amountCents).toBe(500_000);
  });
});
