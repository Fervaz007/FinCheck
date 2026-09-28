PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_commitments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`total_amount_cents` integer,
	`linked_debt_id` integer,
	`linked_recurring_transaction_id` integer,
	`periods_to_spread` integer NOT NULL,
	`accumulated_cents` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`linked_debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`linked_recurring_transaction_id`) REFERENCES `recurring_transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_commitments`("id", "name", "total_amount_cents", "periods_to_spread", "accumulated_cents", "is_active", "created_at") SELECT "id", "name", "total_amount_cents", "periods_to_spread", "accumulated_cents", "is_active", "created_at" FROM `commitments`;--> statement-breakpoint
DROP TABLE `commitments`;--> statement-breakpoint
ALTER TABLE `__new_commitments` RENAME TO `commitments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;