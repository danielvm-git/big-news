// ---------------------------------------------------------------------------
// Integration tests for the PostgreSQL settings adapter (e02s05)
// Requires a running Postgres on DATABASE_URL with migrations applied
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';
import { createSettingsAdapter } from '../settings-adapter';

let sql: postgres.Sql;
let adapter: ReturnType<typeof createSettingsAdapter>;

beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  sql = postgres(url, { max: 2 });
  adapter = createSettingsAdapter(sql);
});

afterAll(async () => {
  // Clean up settings row
  if (sql) {
    await sql`DELETE FROM settings`.catch(() => {});
    await sql.end();
  }
});

describe('PostgreSQL settings adapter', () => {
  it('returns null when no settings exist', async () => {
    // Clean the table first
    await sql`DELETE FROM settings`;
    const result = await adapter.getSettings();
    expect(result).toBeNull();
  });

  it('updateSettings inserts and returns the new row', async () => {
    const result = await adapter.updateSettings({
      site_name: 'Big News',
      tagline: 'Your trusted news source',
      description: 'An open-source news CMS',
    });

    expect(result.site_name).toBe('Big News');
    expect(result.tagline).toBe('Your trusted news source');
    expect(result.description).toBe('An open-source news CMS');
    expect(result.locale).toBe('en'); // default
  });

  it('getSettings returns the current row after insert', async () => {
    const result = await adapter.getSettings();
    expect(result).not.toBeNull();
    expect(result!.site_name).toBe('Big News');
  });

  it('second updateSettings overwrites, not duplicates', async () => {
    await adapter.updateSettings({ site_name: 'Super News' });

    // Should only be one row
    const result = await adapter.getSettings();
    expect(result).not.toBeNull();
    expect(result!.site_name).toBe('Super News');

    const rows = await sql`SELECT COUNT(*)::int AS count FROM settings`;
    expect(rows[0].count).toBe(1);
  });

  it('partial update merges with existing values', async () => {
    await adapter.updateSettings({ tagline: 'Updated tagline' });

    const result = await adapter.getSettings();
    expect(result!.site_name).toBe('Super News'); // unchanged
    expect(result!.tagline).toBe('Updated tagline'); // updated
    expect(result!.locale).toBe('en'); // still default
  });

  it('all fields can be set including nullable ones', async () => {
    await adapter.updateSettings({
      site_name: 'Full Test',
      tagline: 'Testing all fields',
      description: 'Description here',
      logo_url: 'https://example.com/logo.png',
      favicon_url: 'https://example.com/favicon.ico',
      locale: 'pt-br',
    });

    const result = await adapter.getSettings();
    expect(result!.logo_url).toBe('https://example.com/logo.png');
    expect(result!.favicon_url).toBe('https://example.com/favicon.ico');
    expect(result!.locale).toBe('pt-br');
  });
});
