import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ValidationError, validate, validateRequest } from '../validation';

const schema = z.object({ title: z.string().min(1), count: z.number().int() });

describe('validate', () => {
  it('returns the parsed, typed value for valid input', () => {
    const data = validate(schema, { title: 'hi', count: 3 });
    expect(data).toEqual({ title: 'hi', count: 3 });
    // type-level: data.title is a string — exercised by using it as one
    expect(data.title.toUpperCase()).toBe('HI');
  });

  it('throws a ValidationError with a safe generic message that leaks no internals', () => {
    let caught: unknown;
    try {
      validate(schema, { title: '', count: 'not-a-number' });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ValidationError);
    const message = (caught as ValidationError).message;
    expect(message).toBe('Invalid request');
    expect(message).not.toMatch(/count|title|expected|zod/i);
  });
});

describe('validateRequest (route helper)', () => {
  it('returns the typed data on success', () => {
    const result = validateRequest(schema, { title: 'ok', count: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ title: 'ok', count: 1 });
  });

  it('returns a 400 Response with a generic error body on failure', async () => {
    const result = validateRequest(schema, { title: '', count: 1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response).toBeInstanceOf(Response);
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body).toEqual({ error: 'Invalid request' });
    }
  });
});
