// ---------------------------------------------------------------------------
// Integration tests for database migrations (e02s03)
// Requires a running Postgres on DATABASE_URL (Neon or local)
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';
import { runMigrations } from '../migrate';

let sql: postgres.Sql;

beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required for migration integration tests');
  }
  sql = postgres(url, { max: 2 });
});

afterAll(async () => {
  await sql?.end();
});

/**
 * Drop all app tables (not the full public schema — avoids breaking
 * node-pg-migrate's internal type cache).
 */
async function dropAll(sql: postgres.Sql): Promise<void> {
  await sql`DROP TABLE IF EXISTS sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS article_translations CASCADE`;
  await sql`DROP TABLE IF EXISTS articles CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  await sql`DROP TABLE IF EXISTS settings CASCADE`;
  await sql`DROP TABLE IF EXISTS pgmigrations CASCADE`;
}

describe('Database migrations', () => {
  it('applies all migrations and creates the expected schema', { timeout: 60_000 }, async () => {
    await runMigrations();

    // ── Tables exist ──────────────────────────────────────
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != 'pgmigrations'
      ORDER BY table_name
    `;
    const tableNames = tables.map((r) => r.table_name);
    expect(tableNames).toContain('articles');
    expect(tableNames).toContain('article_translations');
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('settings');
    expect(tableNames).toContain('sessions');

    // ── Articles columns ──────────────────────────────────
    const articleCols = await sql`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'articles'
      ORDER BY ordinal_position
    `;
    const articleNames = articleCols.map((c) => c.column_name);
    expect(articleNames).toContain('id');
    expect(articleNames).toContain('category');
    expect(articleNames).toContain('tags');
    expect(articleNames).toContain('featured_image');
    expect(articleNames).toContain('featured_image_alt');
    expect(articleNames).toContain('status');
    expect(articleNames).toContain('featured');
    expect(articleNames).toContain('author_id');
    expect(articleNames).toContain('author_name');
    expect(articleNames).toContain('published_at');
    expect(articleNames).toContain('created_at');
    expect(articleNames).toContain('updated_at');

    // ── Translation columns + FK cascade ──────────────────
    const transCols = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'article_translations'
      ORDER BY ordinal_position
    `;
    const transNames = transCols.map((c) => c.column_name);
    expect(transNames).toContain('id');
    expect(transNames).toContain('article_id');
    expect(transNames).toContain('language');
    expect(transNames).toContain('title');
    expect(transNames).toContain('slug');
    expect(transNames).toContain('excerpt');
    expect(transNames).toContain('content');
    expect(transNames).toContain('meta_title');
    expect(transNames).toContain('meta_description');

    // Verify FK ON DELETE CASCADE
    const fkResult = await sql`
      SELECT tc.constraint_name, rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name = 'article_translations'
        AND tc.constraint_type = 'FOREIGN KEY'
    `;
    expect(fkResult.length).toBeGreaterThan(0);
    expect(fkResult[0].delete_rule).toBe('CASCADE');

    // ── Full-text search index ────────────────────────────
    const indexes = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'article_translations'
        AND indexdef LIKE '%to_tsvector%'
    `;
    expect(indexes.length).toBeGreaterThan(0);
    expect(indexes[0].indexdef).toMatch(/gin/i);

    // ── Users, settings, sessions columns ─────────────────
    const userCols = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' ORDER BY ordinal_position
    `;
    const userNames = userCols.map((c) => c.column_name);
    expect(userNames).toContain('id');
    expect(userNames).toContain('email');
    expect(userNames).toContain('name');
    expect(userNames).toContain('role');
    expect(userNames).toContain('created_at');

    const settingsCols = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'settings' ORDER BY ordinal_position
    `;
    const settingsNames = settingsCols.map((c) => c.column_name);
    expect(settingsNames).toContain('site_name');
    expect(settingsNames).toContain('tagline');
    expect(settingsNames).toContain('description');
    expect(settingsNames).toContain('logo_url');
    expect(settingsNames).toContain('favicon_url');
    expect(settingsNames).toContain('locale');

    const sessCols = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'sessions' ORDER BY ordinal_position
    `;
    const sessNames = sessCols.map((c) => c.column_name);
    expect(sessNames).toContain('id');
    expect(sessNames).toContain('user_id');
    expect(sessNames).toContain('token');
    expect(sessNames).toContain('expires_at');
    expect(sessNames).toContain('created_at');
  });

  it('re-applies cleanly after schema drop (round-trip)', async () => {
    // Drop schema via raw SQL (fast on pooled Neon connections)
    await dropAll(sql);

    await runMigrations();

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != 'pgmigrations'
    `;
    const tableNames = tables.map((r) => r.table_name);
    expect(tableNames).toEqual(
      expect.arrayContaining(['articles', 'article_translations', 'users', 'settings', 'sessions'])
    );
  });

  it('is idempotent — running migrations again does not error', { timeout: 60_000 }, async () => {
    // Schema is already up to date; running again should be a no-op
    await expect(runMigrations()).resolves.not.toThrow();
  });
});
