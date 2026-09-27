import { and, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { accounts, debtPayments, expenses, income } from '@/db/schema';
import type { NewAccount } from '@/models';

export async function listAccounts() {
  return db.select().from(accounts).where(eq(accounts.isActive, true));
}

export async function createAccount(input: NewAccount) {
  const [row] = await db.insert(accounts).values(input).returning();
  return row;
}

export async function updateAccount(id: number, input: Partial<NewAccount>) {
  const [row] = await db.update(accounts).set(input).where(eq(accounts.id, id)).returning();
  return row;
}

export async function deactivateAccount(id: number) {
  await db.update(accounts).set({ isActive: false }).where(eq(accounts.id, id));
}

export async function getAccountBalanceCents(accountId: number): Promise<number> {
  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
  if (!account) return 0;

  const incomeRows = await db
    .select({ amountCents: income.amountCents })
    .from(income)
    .where(eq(income.accountId, accountId));
  const expenseRows = await db
    .select({ amountCents: expenses.amountCents })
    .from(expenses)
    .where(eq(expenses.accountId, accountId));
  const confirmedPaymentRows = await db
    .select({ amountCents: debtPayments.amountCents })
    .from(debtPayments)
    .where(and(eq(debtPayments.accountId, accountId), eq(debtPayments.status, 'confirmed')));

  const incomeSum = incomeRows.reduce((sum, r) => sum + r.amountCents, 0);
  const expenseSum = expenseRows.reduce((sum, r) => sum + r.amountCents, 0);
  const paymentsSum = confirmedPaymentRows.reduce((sum, r) => sum + r.amountCents, 0);

  return account.initialBalanceCents + incomeSum - expenseSum - paymentsSum;
}

export async function listAccountsWithBalances() {
  const accountRows = await listAccounts();
  return Promise.all(
    accountRows.map(async (account) => ({
      ...account,
      balanceCents: await getAccountBalanceCents(account.id),
    })),
  );
}
