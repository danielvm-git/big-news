import { describe, it, expect, afterAll } from 'vitest';
import postgres from 'postgres';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://bignews:bignews@localhost:5433/bignews_test';

const sql = postgres(DATABASE_URL, { max: 1 });

afterAll(async () => {
  await sql.end();
});

describe('database connection', () => {
  it('connects and returns a result', async () => {
    const [row] = await sql`SELECT 1 AS value`;
    expect(row.value).toBe(1);
  });
});
