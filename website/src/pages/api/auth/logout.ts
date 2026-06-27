import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/adapter/postgres/connection';
import { createAuthAdapter } from '../../../lib/adapter/postgres/auth-adapter';
import { clearSessionCookie, getSessionToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const token = getSessionToken(request);

  if (token) {
    try {
      const sql = getDb();
      const auth = createAuthAdapter(sql);
      await auth.destroySession(token);
    } catch {
      // Ignore errors — we clear the cookie either way
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(),
    },
  });
};
