// ---------------------------------------------------------------------------
// Unit tests for auth helpers (e03)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { createSessionCookie, clearSessionCookie, getSessionToken, isAllowedOrigin } from '../auth';

describe('createSessionCookie', () => {
  it('includes HttpOnly, Secure, SameSite=Lax', () => {
    const cookie = createSessionCookie('test-token');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('test-token');
  });

  it('includes Max-Age of 7 days', () => {
    const cookie = createSessionCookie('t');
    expect(cookie).toContain('Max-Age=604800');
  });

  it('sets Path=/', () => {
    const cookie = createSessionCookie('t');
    expect(cookie).toContain('Path=/');
  });
});

describe('clearSessionCookie', () => {
  it('sets Max-Age=0 and clears the value', () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain(`${'big-news-session'}=`);
  });
});

describe('getSessionToken', () => {
  it('extracts token from cookie header', () => {
    const headers = new Headers({ cookie: 'big-news-session=my-token; other=val' });
    const request = new Request('http://localhost', { headers });
    expect(getSessionToken(request)).toBe('my-token');
  });

  it('returns null when no cookie exists', () => {
    const request = new Request('http://localhost');
    expect(getSessionToken(request)).toBeNull();
  });

  it('returns null when session cookie is missing', () => {
    const headers = new Headers({ cookie: 'other=val' });
    const request = new Request('http://localhost', { headers });
    expect(getSessionToken(request)).toBeNull();
  });
});

describe('isAllowedOrigin', () => {
  it('allows localhost', () => {
    const headers = new Headers({ origin: 'http://localhost:4321' });
    const request = new Request('http://localhost', { headers });
    expect(isAllowedOrigin(request)).toBe(true);
  });

  it('allows production origin', () => {
    const headers = new Headers({ origin: 'https://news.bigbase.click' });
    const request = new Request('http://localhost', { headers });
    expect(isAllowedOrigin(request)).toBe(true);
  });

  it('rejects unknown origin', () => {
    const headers = new Headers({ origin: 'https://evil.com' });
    const request = new Request('http://localhost', { headers });
    expect(isAllowedOrigin(request)).toBe(false);
  });

  it('allows requests without origin/referer', () => {
    const request = new Request('http://localhost');
    expect(isAllowedOrigin(request)).toBe(true);
  });
});
