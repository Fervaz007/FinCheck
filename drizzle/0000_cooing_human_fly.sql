CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`initial_balance_cents` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'MXN' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `budget_rule_allocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`budget_rule_id` integer NOT NULL,
	`label` text NOT NULL,
	`percentage` integer NOT NULL,
	FOREIGN KEY (`budget_rule_id`) REFERENCES `budget_rules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`is_custom` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`movement_type` text NOT NULL,
	`budget_group` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `debt_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`debt_id` integer NOT NULL,
	`account_id` integer,
	`amount_cents` integer NOT NULL,
	`occurrence_date` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`confirmed_at` text,
	`recurring_transaction_id` integer,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recurring_transaction_id`) REFERENCES `recurring_transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`debt_type` text NOT NULL,
	`original_amount_cents` integer NOT NULL,
	`saldo_pendiente_cents` integer NOT NULL,
	`monthly_payment_cents` integer NOT NULL,
	`interest_rate_bps` integer,
	`remaining_payments` integer,
	`start_date` text NOT NULL,
	`due_date` text,
	`status` text DEFAULT 'activa' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`category_id` integer,
	`account_id` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`recurring_transaction_id` integer,
	`occurrence_date` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recurring_transaction_id`) REFERENCES `recurring_transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `income` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`category_id` integer,
	`account_id` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`recurring_transaction_id` integer,
	`occurrence_date` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recurring_transaction_id`) REFERENCES `recurring_transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `monthly_summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`income_total_cents` integer NOT NULL,
	`expense_total_cents` integer NOT NULL,
	`debt_payment_total_cents` integer NOT NULL,
	`savings_total_cents` integer NOT NULL,
	`available_cents` integer NOT NULL,
	`budget_rule_id_snapshot` integer,
	`debt_limit_pct_snapshot` integer,
	`health_status_snapshot` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_summaries_year_month` ON `monthly_summaries` (`year`,`month`);--> statement-breakpoint
CREATE TABLE `recurrence_occurrences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recurring_transaction_id` integer NOT NULL,
	`occurrence_date` text NOT NULL,
	`generated_entity_type` text NOT NULL,
	`generated_entity_id` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`recurring_transaction_id`) REFERENCES `recurring_transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recurrence_occurrences_unique` ON `recurrence_occurrences` (`recurring_transaction_id`,`occurrence_date`);--> statement-breakpoint
CREATE TABLE `recurring_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`description` text NOT NULL,
	`category_id` integer,
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
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`debt_limit_pct` integer DEFAULT 30 NOT NULL,
	`active_budget_rule_id` integer,
	`currency` text DEFAULT 'MXN' NOT NULL,
	`last_reconciled_at` text,
	FOREIGN KEY (`active_budget_rule_id`) REFERENCES `budget_rules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `simulations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`product_name` text,
	`price_cents` integer NOT NULL,
	`down_payment_cents` integer DEFAULT 0 NOT NULL,
	`financed_amount_cents` integer NOT NULL,
	`monthly_payment_cents` integer NOT NULL,
	`term_months` integer NOT NULL,
	`interest_rate_bps` integer,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
