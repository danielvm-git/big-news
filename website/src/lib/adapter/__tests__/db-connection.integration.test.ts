import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { getDb, closeDb, resetDb } from '../postgres/connection';

describe('database connection', () => {
  beforeAll(() => {
    resetDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it('connects and returns a result', async () => {
    const sql = getDb();
    const [row] = await sql`SELECT 1 AS value`;
    expect(row.value).toBe(1);
  });
});
