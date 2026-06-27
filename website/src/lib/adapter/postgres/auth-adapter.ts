// ---------------------------------------------------------------------------
// PostgreSQL auth adapter — implements AuthAdapter over postgres.js
// ADR-0003: seed-only admin (no public registration)
// ---------------------------------------------------------------------------

import { randomUUID, randomBytes } from 'node:crypto';
import type postgres from 'postgres';
import type { UserData, SessionData, AuthAdapter } from '../types';

function rowToUser(row: postgres.Row): UserData {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as UserData['role'],
    created_at: row.created_at as Date,
  };
}

export function createAuthAdapter(sql: postgres.Sql): AuthAdapter {
  return {
    async createUser(data) {
      const { hash } = await import('argon2');
      const passwordHash = await hash(data.password);

      const [row] = await sql`
        INSERT INTO users (email, name, role, password_hash)
        VALUES (${data.email}, ${data.name}, ${data.role}, ${passwordHash})
        RETURNING id, email, name, role, created_at
      `;
      return rowToUser(row);
    },

    async authenticateUser(email, password) {
      const argon2 = await import('argon2');

      const [row] = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;
      if (!row) return null;

      const passwordHash = row.password_hash as string;
      const valid = await argon2.verify(passwordHash, password).catch(() => false);
      if (!valid) return null;

      return rowToUser(row);
    },

    async createSession(userId) {
      const token = randomBytes(32).toString('hex');
      // Sessions expire in 7 days
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const [row] = await sql`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (${userId}, ${token}, ${expiresAt})
        RETURNING id, user_id, token, expires_at, created_at
      `;
      return {
        id: row.id as string,
        user_id: row.user_id as string,
        token: row.token as string,
        expires_at: row.expires_at as Date,
        created_at: row.created_at as Date,
      };
    },

    async validateSession(token) {
      const [row] = await sql`
        SELECT u.id, u.email, u.name, u.role, u.created_at
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ${token}
          AND s.expires_at > now()
      `;
      return row ? rowToUser(row) : null;
    },

    async destroySession(token) {
      await sql`DELETE FROM sessions WHERE token = ${token}`;
    },

    async getUser(id) {
      const [row] = await sql`
        SELECT id, email, name, role, created_at FROM users WHERE id = ${id}
      `;
      return row ? rowToUser(row) : null;
    },
  };
}
