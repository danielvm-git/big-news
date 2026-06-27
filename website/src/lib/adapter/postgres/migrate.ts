// ---------------------------------------------------------------------------
// Database migration runner — delegates to node-pg-migrate programmatic API
// ADR-0002: node-pg-migrate for versioned PostgreSQL migrations
// ---------------------------------------------------------------------------

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, '../../../..', 'migrations');

/**
 * Run all pending migrations.
 *
 * Uses `node-pg-migrate`'s programmatic API (which manages its own `pg`
 * connection internally — incompatible with the postgres.js client our app
 * uses, so we pass the connection URL string).
 *
 * node-pg-migrate handles concurrent safety with its own advisory lock.
 * Safe to call on every app startup — no-op when all migrations are applied.
 */
export async function runMigrations(): Promise<void> {
  const databaseUrl =
    typeof process.env.DATABASE_URL === 'string'
      ? process.env.DATABASE_URL
      : 'postgres://localhost:5432/postgres';

  const { runner } = await import('node-pg-migrate');

  await runner({
    databaseUrl,
    dir: MIGRATIONS_DIR,
    direction: 'up',
    migrationsTable: 'pgmigrations',
    count: Infinity,
    log: () => {
      /* silent — use structured logger in production */
    },
  });
}

/**
 * Roll back all migrations (for testing / teardown).
 */
export async function dropMigrations(): Promise<void> {
  const databaseUrl =
    typeof process.env.DATABASE_URL === 'string'
      ? process.env.DATABASE_URL
      : 'postgres://localhost:5432/postgres';

  const { runner } = await import('node-pg-migrate');

  await runner({
    databaseUrl,
    dir: MIGRATIONS_DIR,
    direction: 'down',
    migrationsTable: 'pgmigrations',
    count: Infinity,
    log: () => {
      /* silent */
    },
  });
}
