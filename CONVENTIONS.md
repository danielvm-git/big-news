# big-news Conventions

## Language Policy (ADR-0020) — Load-Bearing

The **project** is English: all code, identifiers, comments, file/dir names, route paths, log messages, default/internal strings, error messages, commit messages, and documentation are written in **English**. The **product** is multilingual via i18n — English is the canonical/source locale. pt-br ships in v1 as structure proof. Translating code comments or identifiers is a defect.

## Technology

- **Runtime:** Node 22+, ESM-only (`"type": "module"` in package.json)
- **Package manager:** npm (pure npm — `package-lock.json`); site lives in `website/`
- **Framework:** Astro 5+ SSR (`output: "server"`, `@astrojs/node` standalone)
- **Database:** PostgreSQL via postgres.js, migrations via node-pg-migrate
- **Storage:** S3-compatible (default), local FS dev-only
- **CSS:** Tailwind CSS v4 via @tailwindcss/vite
- **Auth:** Server-side sessions, argon2/bcrypt, hardened cookies
- **Editor:** TipTap 3 for admin article editing

## Architecture

- **Single package** (no monorepo)
- **Storage adapter seam** (`src/lib/adapter/`) — TypeScript interface for DB, Auth, Storage
- **i18n routing** foundational — pages under `src/pages/[...locale]/`
- **No public registration** — seed-only admin (ADR-0003)

## Code Standards

- **Functions:** 4–20 lines. **Files:** under 300 lines.
- **Names must be grep-able** (unique, specific).
- **Tests verify behavior through public interfaces** — not implementation details.
- **Boy Scout Rule:** leave files cleaner than you found them.
- No `console.*` — use `src/lib/logger.ts` for structured logging.
- Every API route validates input via a zod schema (ADR-0015).
- Sanitize HTML on write (ADR-0005).
- No secrets in code — all configuration via environment variables.

## Security

- CSP + security headers on every response (ADR-0009)
- Upload hardening: magic-byte validation, re-encode, no SVG (ADR-0010)
- Parameterized queries only — no raw string interpolation (ADR-0011)
- Session tokens in HttpOnly, Secure, SameSite=Lax cookies
- Rate limiting on auth endpoints (ADR-0013)
- CI: dep + secret scanning (ADR-0014)
- /security-review gate before deploy (ADR-0017)

## Git

- Conventional Commits enforced via commitlint
- Feature branches only — no direct work on main
- Manual versioning in `package.json` — starts at `0.1.0` (no semantic-release)

## Testing

- Three-tier pyramid: unit → integration → E2E
- Unit tests use mock adapter (no database required)
- Integration tests run against disposable Postgres
- E2E via Playwright with seeded Postgres
