import type { APIRoute } from 'astro';
import { getDb } from '../../lib/adapter/postgres/connection';
import { logger } from '../../lib/logger';

// Readiness probe — checks DB connectivity.
// Returns 200 when the DB is reachable, 503 otherwise.
// Never leaks connection details or version info.
export const GET: APIRoute = async () => {
  try {
    const sql = getDb();
    await sql`SELECT 1`;
    return new Response(JSON.stringify({ status: 'ok', db: 'up' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    logger.warn('health check failed', { error: err instanceof Error ? err.message : String(err) });
    return new Response(JSON.stringify({ status: 'error', db: 'down' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
