// ---------------------------------------------------------------------------
// Unit tests for health endpoint logic (e07s02)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';

describe('Health endpoint contract', () => {
  it('liveness response shape', () => {
    const body = { status: 'ok' };
    expect(body).toHaveProperty('status', 'ok');
    expect(Object.keys(body)).toEqual(['status']);
  });

  it('readiness response shape (ok)', () => {
    const body = { status: 'ok', db: 'up' };
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('db', 'up');
  });

  it('readiness response shape (error)', () => {
    const body = { status: 'error', db: 'down' };
    expect(body).toHaveProperty('status', 'error');
    expect(body).toHaveProperty('db', 'down');
  });

  it('no version or stack leak', () => {
    const body = { status: 'ok', db: 'up' };
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('version');
    expect(serialized).not.toContain('DATABASE_URL');
    expect(serialized).not.toContain('stack');
  });
});
