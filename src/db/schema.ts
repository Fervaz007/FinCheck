import { sql } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const createdAt = () =>
  text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`);

export const budgetRules = sqliteTable('budget_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(true),
  createdAt: createdAt(),
});

export const budgetRuleAllocations = sqliteTable('budget_rule_allocations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  budgetRuleId: integer('budget_rule_id')
    .notNull()
    .references(() => budgetRules.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  percentage: integer('percentage').notNull(),
  // Any number of rows per rule can be monitored (including zero) — see design.md decision #1.
  isMonitored: integer('is_monitored', { mode: 'boolean' }).notNull().default(false),
});

export const debts = sqliteTable('debts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  // One level deep only: a child (parentDebtId set) never has children of its own.
  parentDebtId: integer('parent_debt_id').references((): AnySQLiteColumn => debts.id),
  // Persisted at creation from the "¿Padre o normal?" choice — not derivable
  // from whether it currently has children (see design.md decision #10).
  isParent: integer('is_parent', { mode: 'boolean' }).notNull().default(false),
  debtType: text('debt_type').notNull(),
  originalAmountCents: integer('original_amount_cents').notNull(),
  saldoPendienteCents: integer('saldo_pendiente_cents').notNull(),
  monthlyPaymentCents: integer('monthly_payment_cents').notNull(),
  interestRateBps: integer('interest_rate_bps'),
  remainingPayments: integer('remaining_payments'),
  startDate: text('start_date').notNull(),
  dueDate: text('due_date'),
  status: text('status', { enum: ['activa', 'pagada', 'cancelada'] })
    .notNull()
    .default('activa'),
  notes: text('notes'),
  // Text snapshot of an active budget rule allocation's label at the time
  // this debt was created/edited — not a foreign key, so it survives the
  // active rule being switched (see design.md decision #6).
  budgetGroupLabel: text('budget_group_label'),
  periodicity: text('periodicity', { enum: ['mensual', 'bimestral'] }),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
  reserveAccumulatedCents: integer('reserve_accumulated_cents').notNull().default(0),
  reserveLastAccrualDate: text('reserve_last_accrual_date'),
  createdAt: createdAt(),
});

export const recurringTransactions = sqliteTable('recurring_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind', { enum: ['income', 'expense', 'debt_payment'] }).notNull(),
  description: text('description').notNull(),
  // Purely descriptive free-text origin tag, only meaningful for kind='income'. See specs/income.
  origin: text('origin'),
  debtId: integer('debt_id').references(() => debts.id),
  amountCents: integer('amount_cents').notNull(),
  recurrenceType: text('recurrence_type', {
    enum: [
      'DAILY_INTERVAL',
      'WEEKLY',
      'MONTHLY_DAY',
      'MONTHLY_LAST_DAY',
      'SEMIMONTHLY_FIXED',
      'MONTHLY_INTERVAL',
      'ANNUAL',
    ],
  }).notNull(),
  recurrenceConfig: text('recurrence_config', { mode: 'json' }).notNull(),
  anchorDate: text('anchor_date').notNull(),
  nextOccurrenceDate: text('next_occurrence_date'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  endDate: text('end_date'),
  createdAt: createdAt(),
});

export const income = sqliteTable('income', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  description: text('description').notNull(),
  // Purely descriptive free-text origin — never read by any calculation. See specs/income.
  origin: text('origin'),
  amountCents: integer('amount_cents').notNull(),
  date: text('date').notNull(),
  notes: text('notes'),
  recurringTransactionId: integer('recurring_transaction_id').references(
    () => recurringTransactions.id,
  ),
  occurrenceDate: text('occurrence_date'),
  createdAt: createdAt(),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  description: text('description').notNull(),
  amountCents: integer('amount_cents').notNull(),
  date: text('date').notNull(),
  notes: text('notes'),
  recurringTransactionId: integer('recurring_transaction_id').references(
    () => recurringTransactions.id,
  ),
  occurrenceDate: text('occurrence_date'),
  createdAt: createdAt(),
});

export const debtPayments = sqliteTable('debt_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  debtId: integer('debt_id')
    .notNull()
    .references(() => debts.id),
  amountCents: integer('amount_cents').notNull(),
  occurrenceDate: text('occurrence_date').notNull(),
  status: text('status', { enum: ['scheduled', 'confirmed'] })
    .notNull()
    .default('scheduled'),
  confirmedAt: text('confirmed_at'),
  recurringTransactionId: integer('recurring_transaction_id').references(
    () => recurringTransactions.id,
  ),
  notes: text('notes'),
  createdAt: createdAt(),
});

export const recurrenceOccurrences = sqliteTable(
  'recurrence_occurrences',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    recurringTransactionId: integer('recurring_transaction_id')
      .notNull()
      .references(() => recurringTransactions.id),
    occurrenceDate: text('occurrence_date').notNull(),
    generatedEntityType: text('generated_entity_type', {
      enum: ['income', 'expense', 'debt_payment'],
    }).notNull(),
    generatedEntityId: integer('generated_entity_id').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('recurrence_occurrences_unique').on(
      table.recurringTransactionId,
      table.occurrenceDate,
    ),
  ],
);

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activeBudgetRuleId: integer('active_budget_rule_id').references(() => budgetRules.id),
  currency: text('currency').notNull().default('MXN'),
  lastReconciledAt: text('last_reconciled_at'),
});

export const simulations = sqliteTable('simulations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  productName: text('product_name'),
  priceCents: integer('price_cents').notNull(),
  downPaymentCents: integer('down_payment_cents').notNull().default(0),
  financedAmountCents: integer('financed_amount_cents').notNull(),
  monthlyPaymentCents: integer('monthly_payment_cents').notNull(),
  termMonths: integer('term_months').notNull(),
  interestRateBps: integer('interest_rate_bps'),
  notes: text('notes'),
  createdAt: createdAt(),
});

export const monthlySummaries = sqliteTable(
  'monthly_summaries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    incomeTotalCents: integer('income_total_cents').notNull(),
    expenseTotalCents: integer('expense_total_cents').notNull(),
    debtPaymentTotalCents: integer('debt_payment_total_cents').notNull(),
    savingsTotalCents: integer('savings_total_cents').notNull(),
    availableCents: integer('available_cents').notNull(),
    budgetRuleIdSnapshot: integer('budget_rule_id_snapshot'),
    debtLimitPctSnapshot: integer('debt_limit_pct_snapshot'),
    healthStatusSnapshot: text('health_status_snapshot'),
    computedAt: createdAt(),
  },
  (table) => [uniqueIndex('monthly_summaries_year_month').on(table.year, table.month)],
);
