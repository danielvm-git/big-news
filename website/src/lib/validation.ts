/**
 * Schema-based input validation (ADR-0015). Every /api/* route parses body/query/params
 * through a zod schema and returns 400 on invalid input before any logic. Error responses
 * carry a generic message only — zod issue details (which would echo field names and
 * submitted values) never reach the client or the message string.
 */
import type { ZodType } from 'zod';
import { logger } from './logger';

const GENERIC_MESSAGE = 'Invalid request';

/** Thrown by {@link validate} when input fails its schema. Message is always generic. */
export class ValidationError extends Error {
  constructor() {
    super(GENERIC_MESSAGE);
    this.name = 'ValidationError';
  }
}

/** Parse `input` through `schema`, returning the typed value or throwing a ValidationError. */
export function validate<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new ValidationError();
  return result.data;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: Response };

/**
 * Route helper: parse `input` and, on failure, hand back a ready-to-return 400 Response
 * with a generic JSON body. On success, hand back the typed data.
 *
 *   const result = validateRequest(schema, body);
 *   if (!result.success) return result.response;
 *   // result.data is typed
 */
export function validateRequest<T>(schema: ZodType<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  logger.warn('input validation failed'); // no input echoed
  return {
    success: false,
    response: new Response(JSON.stringify({ error: GENERIC_MESSAGE }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    }),
  };
}
