import type { APIRoute } from 'astro';

// Liveness probe — no dependencies. Returns 200 immediately.
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
