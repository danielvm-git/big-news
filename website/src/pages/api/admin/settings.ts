import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/adapter/postgres/connection';
import { createSettingsAdapter } from '../../../lib/adapter/postgres/settings-adapter';

export const GET: APIRoute = async () => {
  const sql = getDb();
  const adapter = createSettingsAdapter(sql);
  const settings = await adapter.getSettings();

  return new Response(JSON.stringify(settings ?? {}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  const sql = getDb();
  const adapter = createSettingsAdapter(sql);

  const settings = await adapter.updateSettings({
    site_name: body.site_name,
    tagline: body.tagline,
    description: body.description,
    logo_url: body.logo_url,
    favicon_url: body.favicon_url,
    locale: body.locale,
  });

  return new Response(JSON.stringify(settings), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
