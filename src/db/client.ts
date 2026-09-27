import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const expoDb = openDatabaseSync('fincheck.db', { enableChangeListener: true });

export const db = drizzle(expoDb, { schema });

export function getDb() {
  return db;
}

/** Generic enough to also accept a sql.js/better-sqlite3 database in tests. */
export type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;
