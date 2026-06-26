import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  let raw: string[];
  const originalLevel = process.env.LOG_LEVEL;

  const lines = (): Record<string, unknown>[] => raw.map((line) => JSON.parse(line));

  beforeEach(() => {
    raw = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
      raw.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalLevel === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = originalLevel;
  });

  it('emits one JSON line with level, msg and an ISO timestamp', () => {
    delete process.env.LOG_LEVEL; // default level is info
    logger.info('hello world', { route: '/api/x' });

    expect(lines()).toHaveLength(1);
    expect(lines()[0]).toMatchObject({ level: 'info', msg: 'hello world', route: '/api/x' });
    expect(typeof lines()[0].timestamp).toBe('string');
    expect(() => new Date(lines()[0].timestamp as string).toISOString()).not.toThrow();
    // each call is exactly one newline-terminated line
    expect(raw[0].endsWith('\n')).toBe(true);
  });

  it('redacts sensitive keys including nested ones', () => {
    delete process.env.LOG_LEVEL;
    logger.info('request', {
      cookie: 'session=abc',
      authorization: 'Bearer tok',
      password: 'hunter2',
      DATABASE_URL: 'postgres://user:pw@host/db',
      nested: { token: 'deep-secret', safe: 'keep-me' },
    });

    const [line] = lines();
    expect(line.cookie).toBe('[REDACTED]');
    expect(line.authorization).toBe('[REDACTED]');
    expect(line.password).toBe('[REDACTED]');
    expect(line.DATABASE_URL).toBe('[REDACTED]');
    expect((line.nested as Record<string, unknown>).token).toBe('[REDACTED]');
    expect((line.nested as Record<string, unknown>).safe).toBe('keep-me');
  });

  it('suppresses logs below LOG_LEVEL', () => {
    process.env.LOG_LEVEL = 'warn';
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(lines().map((l) => l.level)).toEqual(['warn', 'error']);
  });
});
