DROP TABLE `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_income` (
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
INSERT INTO `__new_income`("id", "description", "amount_cents", "date", "notes", "recurring_transaction_id", "occurrence_date", "created_at") SELECT "id", "description", "amount_cents", "date", "notes", "recurring_transaction_id", "occurrence_date", "created_at" FROM `income`;--> statement-breakpoint
DROP TABLE `income`;--> statement-breakpoint
ALTER TABLE `__new_income` RENAME TO `income`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_recurring_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`description` text NOT NULL,
	`debt_id` integer,
	`amount_cents` integer NOT NULL,
	`recurrence_type` text NOT NULL,
	`recurrence_config` text NOT NULL,
	`anchor_date` text NOT NULL,
	`next_occurrence_date` text,
	`is_active` integer DEFAULT true NOT NULL,
	`end_date` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_recurring_transactions`("id", "kind", "description", "debt_id", "amount_cents", "recurrence_type", "recurrence_config", "anchor_date", "next_occurrence_date", "is_active", "end_date", "created_at") SELECT "id", "kind", "description", "debt_id", "amount_cents", "recurrence_type", "recurrence_config", "anchor_date", "next_occurrence_date", "is_active", "end_date", "created_at" FROM `recurring_transactions`;--> statement-breakpoint
DROP TABLE `recurring_transactions`;--> statement-breakpoint
ALTER TABLE `__new_recurring_transactions` RENAME TO `recurring_transactions`;