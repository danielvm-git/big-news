import { describe, it, expect } from 'vitest';
import postgres from 'postgres';

describe('database connection', () => {
  it('connects and returns a result', async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');

    const sql = postgres(url, { max: 1 });
    const [row] = await sql`SELECT 1 AS value`;
    expect(row.value).toBe(1);
    await sql.end();
  });
});
