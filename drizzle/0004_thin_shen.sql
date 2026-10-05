DROP TABLE `categories`;--> statement-breakpoint
DROP TABLE `commitments`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_debt_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`debt_id` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`occurrence_date` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`confirmed_at` text,
	`recurring_transaction_id` integer,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recurring_transaction_id`) REFERENCES `recurring_transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_debt_payments`("id", "debt_id", "amount_cents", "occurrence_date", "status", "confirmed_at", "recurring_transaction_id", "notes", "created_at") SELECT "id", "debt_id", "amount_cents", "occurrence_date", "status", "confirmed_at", "recurring_transaction_id", "notes", "created_at" FROM `debt_payments`;--> statement-breakpoint
DROP TABLE `debt_payments`;--> statement-breakpoint
ALTER TABLE `__new_debt_payments` RENAME TO `debt_payments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`recurring_transaction_id` integer,
	`occurrence_date` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`recurring_transaction_id`) REFERENCES `recurring_transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_expenses`("id", "description", "amount_cents", "date", "notes", "recurring_transaction_id", "occurrence_date", "created_at") SELECT "id", "description", "amount_cents", "date", "notes", "recurring_transaction_id", "occurrence_date", "created_at" FROM `expenses`;--> statement-breakpoint
DROP TABLE `expenses`;--> statement-breakpoint
ALTER TABLE `__new_expenses` RENAME TO `expenses`;--> statement-breakpoint
CREATE TABLE `__new_income` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`account_id` integer,
	`amount_cents` integer NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`recurring_transaction_id` integer,
	`occurrence_date` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recurring_transaction_id`) REFERENCES `recurring_transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_income`("id", "description", "account_id", "amount_cents", "date", "notes", "recurring_transaction_id", "occurrence_date", "created_at") SELECT "id", "description", "account_id", "amount_cents", "date", "notes", "recurring_transaction_id", "occurrence_date", "created_at" FROM `income`;--> statement-breakpoint
DROP TABLE `income`;--> statement-breakpoint
ALTER TABLE `__new_income` RENAME TO `income`;--> statement-breakpoint
CREATE TABLE `__new_recurring_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`description` text NOT NULL,
	`account_id` integer,
	`debt_id` integer,
	`amount_cents` integer NOT NULL,
	`recurrence_type` text NOT NULL,
	`recurrence_config` text NOT NULL,
	`anchor_date` text NOT NULL,
	`next_occurrence_date` text,
	`is_active` integer DEFAULT true NOT NULL,
	`end_date` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_recurring_transactions`("id", "kind", "description", "account_id", "debt_id", "amount_cents", "recurrence_type", "recurrence_config", "anchor_date", "next_occurrence_date", "is_active", "end_date", "created_at") SELECT "id", "kind", "description", "account_id", "debt_id", "amount_cents", "recurrence_type", "recurrence_config", "anchor_date", "next_occurrence_date", "is_active", "end_date", "created_at" FROM `recurring_transactions`;--> statement-breakpoint
DROP TABLE `recurring_transactions`;--> statement-breakpoint
ALTER TABLE `__new_recurring_transactions` RENAME TO `recurring_transactions`;--> statement-breakpoint
ALTER TABLE `budget_rule_allocations` ADD `is_debt_limit` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `debts` ADD `budget_group_label` text;--> statement-breakpoint
ALTER TABLE `debts` ADD `periodicity` text;--> statement-breakpoint
ALTER TABLE `debts` ADD `is_recurring` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `debts` ADD `reserve_accumulated_cents` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `debts` ADD `reserve_last_accrual_date` text;--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `debt_limit_pct`;