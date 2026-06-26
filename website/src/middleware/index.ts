/**
 * Request instrumentation (ADR-0018). Assigns a correlation id to every request — reusing
 * an inbound x-request-id when a proxy supplies one, otherwise minting a UUID — exposes it on
 * `locals` and the response header, and logs request completion (method, path, status, latency).
 */
import { defineMiddleware } from 'astro:middleware';
import { logger } from '../lib/logger';

export const onRequest = defineMiddleware(async (context, next) => {
  const requestId = context.request.headers.get('x-request-id') ?? crypto.randomUUID();
  context.locals.requestId = requestId;

  const start = performance.now();
  const response = await next();
  response.headers.set('x-request-id', requestId);

  logger.info('request completed', {
    requestId,
    method: context.request.method,
    path: context.url.pathname,
    status: response.status,
    latencyMs: Math.round(performance.now() - start),
  });

  return response;
});
