// ---------------------------------------------------------------------------
// PostgreSQL settings adapter — implements SettingsAdapter over postgres.js
// Single-row upsert on the settings table.
// ---------------------------------------------------------------------------

import type postgres from 'postgres';
import type { SettingsData, SettingsAdapter } from '../types';

function rowToSettings(row: postgres.Row): SettingsData {
  return {
    site_name: row.site_name as string,
    tagline: row.tagline as string,
    description: row.description as string,
    logo_url: row.logo_url as string | null,
    favicon_url: row.favicon_url as string | null,
    locale: row.locale as string,
  };
}

const DEFAULTS: SettingsData = {
  site_name: '',
  tagline: '',
  description: '',
  logo_url: null,
  favicon_url: null,
  locale: 'en',
};

export function createSettingsAdapter(sql: postgres.Sql): SettingsAdapter {
  return {
    async getSettings() {
      const [row] = await sql`SELECT * FROM settings LIMIT 1`;
      return row ? rowToSettings(row) : null;
    },

    async updateSettings(data) {
      // Single-row upsert: read first row, merge, write
      const [existing] = await sql`SELECT * FROM settings LIMIT 1`;

      if (existing) {
        const merged = { ...rowToSettings(existing), ...data };

        const [row] = await sql`
          UPDATE settings SET
            site_name = ${merged.site_name},
            tagline = ${merged.tagline},
            description = ${merged.description},
            logo_url = ${merged.logo_url},
            favicon_url = ${merged.favicon_url},
            locale = ${merged.locale}
          WHERE id = ${existing.id}
          RETURNING *
        `;
        return rowToSettings(row);
      }

      // No row yet — insert
      const merged = { ...DEFAULTS, ...data };

      const [row] = await sql`
        INSERT INTO settings
          (site_name, tagline, description, logo_url, favicon_url, locale)
        VALUES (
          ${merged.site_name}, ${merged.tagline}, ${merged.description},
          ${merged.logo_url}, ${merged.favicon_url}, ${merged.locale}
        )
        RETURNING *
      `;
      return rowToSettings(row);
    },
  };
}
