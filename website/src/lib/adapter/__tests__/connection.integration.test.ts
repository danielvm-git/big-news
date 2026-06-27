// ---------------------------------------------------------------------------
// Integration tests for the PostgreSQL connection module (e02s02)
// Requires a running test database on DATABASE_URL (default: docker compose)
// ---------------------------------------------------------------------------

import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { getDb, closeDb, resetDb } from '../postgres/connection';

// Store original env so we can restore it
const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;

afterAll(async () => {
  await closeDb();
});

beforeEach(() => {
  resetDb();
});

describe('PostgreSQL connection', () => {
  it('connects and SELECT 1 returns 1', async () => {
    const sql = getDb();
    const [row] = await sql`SELECT 1 AS value`;
    expect(row.value).toBe(1);
  });

  it('returns a singleton client on repeated calls', () => {
    const a = getDb();
    const b = getDb();
    expect(a).toBe(b);
  });

  it('can close and re-create the client', async () => {
    const a = getDb();
    await closeDb();
    const b = getDb();
    expect(a).not.toBe(b);
  });

  it('supports custom options via getDb({ url, max })', async () => {
    const url = ORIGINAL_DATABASE_URL ?? 'postgres://bignews:bignews@localhost:5433/bignews_test';
    const sql = getDb({ url, max: 2 });
    const [row] = await sql`SELECT 1 AS value`;
    expect(row.value).toBe(1);
  });
});

describe('fail-fast when DATABASE_URL is missing', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    // Clear DATABASE_URL for this test group
    delete process.env.DATABASE_URL;
    resetDb();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('throws a descriptive error naming DATABASE_URL when env is unset', () => {
    expect(() => getDb()).toThrow(/DATABASE_URL/);
  });

  it('still works when an explicit url option is passed even without env', () => {
    const url = ORIGINAL_DATABASE_URL ?? 'postgres://bignews:bignews@localhost:5433/bignews_test';
    const sql = getDb({ url });
    // Should not throw — url option takes precedence over env
    expect(sql).toBeDefined();
  });
});
