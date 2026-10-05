import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';

import * as schema from '@/db/schema';
import type { Database } from '@/db/client';

const DDL = `
CREATE TABLE budget_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  is_custom INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE TABLE budget_rule_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  budget_rule_id INTEGER NOT NULL REFERENCES budget_rules(id),
  label TEXT NOT NULL,
  percentage INTEGER NOT NULL,
  is_monitored INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_debt_id INTEGER REFERENCES debts(id),
  is_parent INTEGER NOT NULL DEFAULT 0,
  debt_type TEXT NOT NULL,
  original_amount_cents INTEGER NOT NULL,
  saldo_pendiente_cents INTEGER NOT NULL,
  monthly_payment_cents INTEGER NOT NULL,
  interest_rate_bps INTEGER,
  remaining_payments INTEGER,
  start_date TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'activa',
  notes TEXT,
  budget_group_label TEXT,
  periodicity TEXT,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  reserve_accumulated_cents INTEGER NOT NULL DEFAULT 0,
  reserve_last_accrual_date TEXT,
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE TABLE recurring_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  description TEXT NOT NULL,
  origin TEXT,
  debt_id INTEGER,
  amount_cents INTEGER NOT NULL,
  recurrence_type TEXT NOT NULL,
  recurrence_config TEXT NOT NULL,
  anchor_date TEXT NOT NULL,
  next_occurrence_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE TABLE income (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  origin TEXT,
  amount_cents INTEGER NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  recurring_transaction_id INTEGER,
  occurrence_date TEXT,
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  recurring_transaction_id INTEGER,
  occurrence_date TEXT,
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE TABLE debt_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  debt_id INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  occurrence_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  confirmed_at TEXT,
  recurring_transaction_id INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE TABLE recurrence_occurrences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recurring_transaction_id INTEGER NOT NULL,
  occurrence_date TEXT NOT NULL,
  generated_entity_type TEXT NOT NULL,
  generated_entity_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE UNIQUE INDEX recurrence_occurrences_unique ON recurrence_occurrences (recurring_transaction_id, occurrence_date);
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  active_budget_rule_id INTEGER,
  currency TEXT NOT NULL DEFAULT 'MXN',
  last_reconciled_at TEXT
);
CREATE TABLE simulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  product_name TEXT,
  price_cents INTEGER NOT NULL,
  down_payment_cents INTEGER NOT NULL DEFAULT 0,
  financed_amount_cents INTEGER NOT NULL,
  monthly_payment_cents INTEGER NOT NULL,
  term_months INTEGER NOT NULL,
  interest_rate_bps INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE TABLE monthly_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  income_total_cents INTEGER NOT NULL,
  expense_total_cents INTEGER NOT NULL,
  debt_payment_total_cents INTEGER NOT NULL,
  savings_total_cents INTEGER NOT NULL,
  available_cents INTEGER NOT NULL,
  budget_rule_id_snapshot INTEGER,
  debt_limit_pct_snapshot INTEGER,
  health_status_snapshot TEXT,
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE UNIQUE INDEX monthly_summaries_year_month ON monthly_summaries (year, month);
`;

export async function createTestDb(): Promise<Database> {
  const SQL = await initSqlJs();
  const sqlJsDb = new SQL.Database();
  sqlJsDb.exec(DDL);
  return drizzle(sqlJsDb, { schema }) as unknown as Database;
}
