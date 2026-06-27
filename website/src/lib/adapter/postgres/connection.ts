// ---------------------------------------------------------------------------
// PostgreSQL connection — lazy singleton postgres.js client
// ADR-0001: postgres.js single-TCP driver
// ---------------------------------------------------------------------------

import postgres from 'postgres';

let _sql: postgres.Sql | null = null;

interface ConnectionOptions {
  /** Explicit database URL; defaults to process.env.DATABASE_URL */
  url?: string;
  /** Maximum connection pool size (default: 10) */
  max?: number;
}

/**
 * Get or initialise the singleton postgres.js client.
 *
 * Reads `DATABASE_URL` from the environment. When the URL or PGSSLMODE
 * indicates SSL is required, the client connects over TLS automatically
 * (postgres.js uses `ssl: 'require'` when it detects sslmode in the URL).
 *
 * Throws a descriptive error if DATABASE_URL is not set.
 */
export function getDb(options?: ConnectionOptions): postgres.Sql {
  if (_sql) return _sql;

  const url = options?.url ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      'Missing required environment variable: DATABASE_URL. ' +
        'Set DATABASE_URL to a valid PostgreSQL connection string, e.g. ' +
        'postgres://user:password@localhost:5432/dbname.'
    );
  }

  const ssl = shouldUseSsl(url);

  _sql = postgres(url, {
    max: options?.max ?? 10,
    ssl,
    // Allow postgres.js to auto-detect connection details; no extra defaults.
  });

  return _sql;
}

/**
 * Close the singleton client, if open. Safe to call multiple times.
 * After closing, the next call to getDb() will create a fresh client.
 */
export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end();
    _sql = null;
  }
}

/**
 * Reset the singleton (for test teardown / reconnect scenarios).
 */
export function resetDb(): void {
  _sql = null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine whether SSL should be enabled based on the connection URL or
 * the PGSSLMODE environment variable.
 */
function shouldUseSsl(url: string): boolean | 'require' | 'prefer' {
  // PGSSLMODE env var takes precedence
  const pgSslMode = process.env.PGSSLMODE;
  if (pgSslMode) {
    if (pgSslMode === 'disable') return false;
    if (pgSslMode === 'prefer') return 'prefer';
    // require, verify-ca, verify-full → 'require'
    return 'require';
  }

  // Detect sslmode query parameter in the URL
  const u = new URL(url);
  const sslMode = u.searchParams.get('sslmode');
  if (sslMode) {
    // postgres.js translates 'require'/'verify-ca'/'verify-full' to SSL
    return sslMode !== 'disable';
  }

  // Default: hosted providers often have ?sslmode=require or ?ssl=true
  // If neither is set, assume no SSL (local dev)
  return false;
}
