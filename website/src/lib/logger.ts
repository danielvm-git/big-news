/**
 * Structured JSON logger (ADR-0018). The ONE sanctioned stdout sink — all other code
 * uses this instead of `console.*` (CONVENTIONS.md). Emits one newline-terminated JSON
 * object per call: { level, msg, timestamp, ...context }. Secrets in the context are
 * redacted recursively. Level threshold is read from LOG_LEVEL on every call so it can
 * be reconfigured at runtime (and in tests).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const DEFAULT_LEVEL: LogLevel = 'info';

/** Keys whose values are replaced with [REDACTED] (case-insensitive, matched anywhere in the key). */
const REDACT_KEYS = [
  'cookie',
  'set-cookie',
  'authorization',
  'password',
  'token',
  'secret',
  'database_url',
];

const REDACTED = '[REDACTED]';

function thresholdLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  return raw && raw in LEVEL_ORDER ? (raw as LogLevel) : DEFAULT_LEVEL;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[thresholdLevel()];
}

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return REDACT_KEYS.some((needle) => lower.includes(needle));
}

/** Recursively redact sensitive keys in plain objects and arrays. */
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? REDACTED : redact(val);
    }
    return out;
  }
  return value;
}

export type LogContext = Record<string, unknown>;

function emit(level: LogLevel, msg: string, context?: LogContext): void {
  if (!shouldLog(level)) return;
  const record = {
    level,
    msg,
    timestamp: new Date().toISOString(),
    ...(redact(context ?? {}) as LogContext),
  };
  process.stdout.write(`${JSON.stringify(record)}\n`);
}

export const logger = {
  debug: (msg: string, context?: LogContext) => emit('debug', msg, context),
  info: (msg: string, context?: LogContext) => emit('info', msg, context),
  warn: (msg: string, context?: LogContext) => emit('warn', msg, context),
  error: (msg: string, context?: LogContext) => emit('error', msg, context),
};
