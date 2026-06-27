// ---------------------------------------------------------------------------
// Auth helpers — cookie management, session utilities
// ---------------------------------------------------------------------------

import { randomUUID } from 'node:crypto';

const SESSION_COOKIE = 'big-news-session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Create a Set-Cookie header value for the session token.
 */
export function createSessionCookie(token: string): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Path=/`,
    `Max-Age=${SESSION_MAX_AGE}`,
  ].join('; ');
}

/**
 * Create a Set-Cookie header value that clears the session cookie.
 */
export function clearSessionCookie(): string {
  return [`${SESSION_COOKIE}=`, 'HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=0'].join(
    '; '
  );
}

/**
 * Extract the session token from a request's Cookie header.
 */
export function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;

  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) {
      return rest.join('=');
    }
  }

  return null;
}

/**
 * Generate a CSRF token for a session.
 */
export function generateCsrfToken(): string {
  return randomUUID();
}

/**
 * Check if a request origin is allowed (CSRF protection).
 * Only allows same-origin requests based on Origin/Referer headers.
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // If neither header is present, allow (browsers always send at least one)
  if (!origin && !referer) return true;

  // Check against known allowed origins
  const allowedOrigins = ['http://localhost:4321', 'https://news.bigbase.click'];

  const url = origin || referer;
  if (!url) return true;

  try {
    const parsed = new URL(url);
    return allowedOrigins.some((allowed) => parsed.origin === new URL(allowed).origin);
  } catch {
    return false;
  }
}
