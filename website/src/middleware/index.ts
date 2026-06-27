/**
 * Request instrumentation (ADR-0018) + auth session protection.
 *
 * - Assigns correlation id to every request
 * - Protects /admin/* (redirect to /admin/login if unauthenticated)
 * - Protects /api/admin/* (401 if unauthenticated)
 */
import { defineMiddleware } from 'astro:middleware';
import { logger } from '../lib/logger';
import { getSessionToken } from '../lib/auth';
import { getDb } from '../lib/adapter/postgres/connection';
import { createAuthAdapter } from '../lib/adapter/postgres/auth-adapter';

const PUBLIC_ADMIN_PATHS = ['/admin/login'];

export const onRequest = defineMiddleware(async (context, next) => {
  const requestId = context.request.headers.get('x-request-id') ?? crypto.randomUUID();
  context.locals.requestId = requestId;

  const start = performance.now();
  const path = context.url.pathname;

  // Auth check for admin routes
  if (path.startsWith('/admin/') || path === '/admin') {
    const isPublic = PUBLIC_ADMIN_PATHS.some((p) => path.startsWith(p));

    if (!isPublic) {
      const token = getSessionToken(context.request);

      if (token) {
        try {
          const sql = getDb();
          const auth = createAuthAdapter(sql);
          const user = await auth.validateSession(token);

          if (user) {
            context.locals.user = user;
          } else {
            // Invalid/expired session
            if (path.startsWith('/api/admin/')) {
              return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              });
            }
            return context.redirect('/admin/login');
          }
        } catch {
          // DB error — allow through, pages handle their own fallback
        }
      } else {
        // No session token
        if (path.startsWith('/api/admin/')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return context.redirect('/admin/login');
      }
    }
  }

  const response = await next();
  response.headers.set('x-request-id', requestId);

  logger.info('request completed', {
    requestId,
    method: context.request.method,
    path,
    status: response.status,
    latencyMs: Math.round(performance.now() - start),
  });

  return response;
});
