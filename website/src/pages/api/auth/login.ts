import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/adapter/postgres/connection';
import { createAuthAdapter } from '../../../lib/adapter/postgres/auth-adapter';
import { createSessionCookie, isAllowedOrigin } from '../../../lib/auth';
import { logger } from '../../../lib/logger';

export const POST: APIRoute = async ({ request }) => {
  // CSRF check
  if (!isAllowedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = getDb();
    const auth = createAuthAdapter(sql);
    const user = await auth.authenticateUser(email, password);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await auth.createSession(user.id);
    const cookie = createSessionCookie(session.token);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    logger.warn('login error', { error: err instanceof Error ? err.message : String(err) });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
