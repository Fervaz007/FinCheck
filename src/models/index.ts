import type * as schema from '@/db/schema';

export type Income = typeof schema.income.$inferSelect;
export type NewIncome = typeof schema.income.$inferInsert;

export type Expense = typeof schema.expenses.$inferSelect;
export type NewExpense = typeof schema.expenses.$inferInsert;

export type Debt = typeof schema.debts.$inferSelect;
export type NewDebt = typeof schema.debts.$inferInsert;

export type DebtPayment = typeof schema.debtPayments.$inferSelect;
export type NewDebtPayment = typeof schema.debtPayments.$inferInsert;

export type BudgetRule = typeof schema.budgetRules.$inferSelect;
export type BudgetRuleAllocation = typeof schema.budgetRuleAllocations.$inferSelect;

export type RecurringTransaction = typeof schema.recurringTransactions.$inferSelect;
export type NewRecurringTransaction = typeof schema.recurringTransactions.$inferInsert;

export type Simulation = typeof schema.simulations.$inferSelect;
export type NewSimulation = typeof schema.simulations.$inferInsert;

export type MonthlySummary = typeof schema.monthlySummaries.$inferSelect;

export type Settings = typeof schema.settings.$inferSelect;
