# CLAUDE.md — big-news

## Project Overview

Open-source PostgreSQL news CMS (Astro 5+ / PostgreSQL). Ported from astrobiologia.

The Astro site lives in the `website/` directory. Run all `npm` commands from `website/`.

## Commands

> Package manager: **npm** (pure npm — `package-lock.json` is the lockfile). Run from `website/`.

### Development

- `npm run dev` — Start dev server on localhost:4321
- `npm run build` — Production SSR build to dist/
- `npm run preview` — Preview production build
- `npm run astro` — Run astro CLI

### Quality

- `npm run typecheck` — TypeScript type checking (astro check)
- `npm run format` — Format all files with Prettier
- `npm run format:check` — Check formatting

### Testing

- `npm run test:unit` — Unit tests (Vitest, mock adapter, no DB)
- `npm run test:integration` — Integration tests (real Postgres)
- `npm run test:e2e` — Playwright E2E tests
- `npm test` — All Vitest tests
- `npm run preflight` — Full pre-commit check (typecheck + format + build)

## Architecture

- Single package (no monorepo) in `website/`, ESM-only, Node 22+, npm
- Versioning is manual in `package.json` — starts at `0.1.0` (no semantic-release)
- Astro 5+ SSR with `@astrojs/node` standalone adapter
- PostgreSQL via postgres.js (postgres) with node-pg-migrate
- S3-compatible storage (default), local FS dev-only
- Thin storage-adapter seam (src/lib/adapter/) — testable via mock
- i18n: defaultLocale "en", v1 locales [en, pt-br], prefixDefaultLocale: false
- React 19 islands for admin components
- Tailwind CSS v4 via @tailwindcss/vite

## Key Conventions

- All code/identifiers/comments/routes/strings/docs in English (ADR-0020)
- Conventional Commits (commitlint + Husky enforced)
- No console.\* — use structured logger (src/lib/logger.ts)
- All API routes validate input via zod schema
- Sanitize HTML on write (sanitize-html)
- No secrets in repo — all config via env vars
- No public registration — seed/CLI admin only
