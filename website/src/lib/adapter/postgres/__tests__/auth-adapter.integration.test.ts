// ---------------------------------------------------------------------------
// Integration tests for PostgreSQL auth adapter (e03s01)
// Requires a running Postgres on DATABASE_URL with migrations applied
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';
import { createAuthAdapter } from '../auth-adapter';
import { runMigrations } from '../migrate';

let sql: postgres.Sql;
let adapter: ReturnType<typeof createAuthAdapter>;
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'SecurePass123!';

beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  sql = postgres(url, { max: 2 });

  // Ensure schema is up to date (including password_hash column)
  await runMigrations();

  adapter = createAuthAdapter(sql);
});

afterAll(async () => {
  if (sql) {
    await sql`DELETE FROM users WHERE email LIKE ${'test-%'}`.catch(() => {});
    await sql.end();
  }
});

describe('PostgreSQL auth adapter', () => {
  it('creates a user with hashed password', async () => {
    const user = await adapter.createUser({
      email: testEmail,
      name: 'Test Admin',
      password: testPassword,
      role: 'admin',
    });

    expect(user.id).toBeTruthy();
    expect(user.email).toBe(testEmail);
    expect(user.name).toBe('Test Admin');
    expect(user.role).toBe('admin');

    // Password_hash column exists but is not returned by createUser
    const [row] = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
    expect(row.password_hash).toBeTruthy();
    expect(row.password_hash).not.toBe(testPassword); // not plaintext
  });

  it('authenticates with correct credentials', async () => {
    const user = await adapter.authenticateUser(testEmail, testPassword);
    expect(user).not.toBeNull();
    expect(user!.email).toBe(testEmail);
  });

  it('rejects wrong password', async () => {
    const user = await adapter.authenticateUser(testEmail, 'wrong-password');
    expect(user).toBeNull();
  });

  it('rejects unknown email', async () => {
    const user = await adapter.authenticateUser('nonexistent@example.com', testPassword);
    expect(user).toBeNull();
  });

  it('creates and validates sessions', async () => {
    const user = await adapter.authenticateUser(testEmail, testPassword);
    expect(user).not.toBeNull();

    const session = await adapter.createSession(user!.id);
    expect(session.token).toBeTruthy();
    expect(session.expires_at).toBeInstanceOf(Date);

    const validated = await adapter.validateSession(session.token);
    expect(validated).not.toBeNull();
    expect(validated!.id).toBe(user!.id);
  });

  it('rejects invalid session token', async () => {
    const result = await adapter.validateSession('invalid-token');
    expect(result).toBeNull();
  });

  it('destroys sessions', async () => {
    const user = await adapter.authenticateUser(testEmail, testPassword);
    const session = await adapter.createSession(user!.id);

    // Destroy it
    await adapter.destroySession(session.token);

    // Should be invalid now
    const result = await adapter.validateSession(session.token);
    expect(result).toBeNull();
  });

  it('getUser returns user by id', async () => {
    const user = await adapter.authenticateUser(testEmail, testPassword);
    const fetched = await adapter.getUser(user!.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.email).toBe(testEmail);
  });
});
