import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';

import * as schema from '@/db/schema';
import type { Database } from '@/db/client';

const DDL = `
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  initial_balance_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MXN',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  budget_group TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
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
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE TABLE recurring_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id INTEGER,
  account_id INTEGER,
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
  category_id INTEGER,
  account_id INTEGER NOT NULL,
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
  category_id INTEGER,
  account_id INTEGER NOT NULL,
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
  account_id INTEGER,
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
  debt_limit_pct INTEGER NOT NULL DEFAULT 30,
  active_budget_rule_id INTEGER,
  currency TEXT NOT NULL DEFAULT 'MXN',
  last_reconciled_at TEXT
);
`;

export async function createTestDb(): Promise<Database> {
  const SQL = await initSqlJs();
  const sqlJsDb = new SQL.Database();
  sqlJsDb.exec(DDL);
  return drizzle(sqlJsDb, { schema }) as unknown as Database;
}
