# Tech Stack — big-news

Derived from the upstream `danielvm-git/astrobiologia` source (pnpm monorepo `apps/web-astro`)
and the v1.0 decisions in `specs/adr/`. big-news is a **single package** (no monorepo), managed
with **npm**, living in the **`website/`** directory. Paths written as `src/…` below resolve to
`website/src/…`; run all `npm` commands from `website/`.

## Language Policy (ADR-0020) — load-bearing

The **project** is English: all code, identifiers, comments, file/dir names, route paths, log
messages, default/internal strings, error messages, commit messages, and documentation (README,
CONTRIBUTING, specs, ADRs, CLAUDE.md, CONVENTIONS.md) are written in **English**, regardless of the
language the maintainer uses in conversation. The **product** is multilingual via i18n: English is the
canonical/source locale; pt-br ships in v1 as the proof-of-structure second locale; user-visible
content/UI strings are the only translated artifacts. Translating code comments or identifiers is a defect.

## Runtime & framework

- **Astro 5+** (`output: "server"`, `@astrojs/node` standalone adapter), **Node 22+**, **ESM-only**
- **React 19** islands (`@astrojs/react`) for interactive admin components
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **i18n** configured in `astro.config.mjs`: **`defaultLocale: "en"`** (English is canonical/source), v1 locales **`[en, pt-br]`** (pt-br ships from day one to prove the structure; es/ja/nl/zh deferred post-v1 — ADR-0020), `prefixDefaultLocale: false`. Public pages live under `src/pages/[...locale]/` (foundational, ADR-0018 sequencing rationale).
- **Route paths are English** (ADR-0020): `/articles`, `/categories`, `/search`, `/about`, `/contact`, `/privacy`; admin `/admin/articles`, `/admin/settings`. (Upstream astrobiologia uses Portuguese paths — renamed on port; "parity" is functional, not literal paths.)

## Data & storage (replaces Appwrite)

- **PostgreSQL** via **postgres.js** (`postgres`) — single TCP driver, all providers (ADR-0001)
- **node-pg-migrate** versioned migrations under a `pg_advisory_lock` (ADR-0002)
- **S3-compatible** object storage (`@aws-sdk/client-s3`) default; local FS dev-only (ADR-0006)
- Thin **storage-adapter seam** (`src/lib/adapter/`) — DB + Auth + Storage; mockable test seam (ADR-0004)
- Categories: hardcoded `CATEGORIES` constant (`src/lib/categories.ts`), not a table (matches upstream)

## Auth & security

- **argon2/bcrypt** password hashing; server-side `sessions` table with expiry/rotation (ADR-0012)
- Hardened cookies (`HttpOnly; Secure; SameSite=Lax`), CSRF + DB-backed rate limiting (ADR-0013)
- No public registration — seed/CLI admin only (ADR-0003)
- **sanitize-html** on write (ADR-0005); **zod** input validation at every API boundary (ADR-0015)
- CSP + security headers in middleware (ADR-0009); least-privilege runtime DB role + scoped S3 keys (ADR-0016)

## Editor & content

- **TipTap 3** (`@tiptap/{core,starter-kit,react,pm,extension-image,extension-link,extension-placeholder}`)
- Optional **DeepL** translation, gated on `DEEPL_API_KEY` (ADR-0008); v1 translates en↔pt-br
- Ported libs from upstream: `locale.ts`, `article-locales.ts`, `article-editor-{slug,validation,translate,types}.ts` — **adapted to English-canonical**: the required-base-title validation targets the **default (English)** locale (upstream `getPortugueseTitleValidationError` → `getDefaultLocaleTitleValidationError`, message "Title (English) is required")
- **Category** keys/slugs are **English** (`news`, `interviews`, `analysis`, `brazilian-research`, …) in `src/lib/categories.ts`; human-facing labels are localized per locale

## Observability

- Structured JSON logger with request-id + redaction (`src/lib/logger.ts`), foundational in e01 (ADR-0018)
- `/api/health` (readiness, DB ping) + `/api/health/live` (liveness)
- RSS/Atom, sitemap.xml, robots.txt, 404/500 pages

## Tooling, test & CI

- **npm** (pure npm, `package-lock.json`); Husky + commitlint (Conventional Commits) + Prettier; manual versioning in `website/package.json` starting at `0.1.0` (no semantic-release)
- **Vitest 4** — `unit` project (mock adapter) + `integration` project (real Postgres)
- **Playwright** + **playwright-bdd** E2E
- Test infra: disposable Postgres (docker-compose/Testcontainers); mock adapter mirrors upstream `mock-appwrite.ts`
- CI (GitHub Actions): typecheck → lint → unit → integration (postgres:16 service) → build → E2E → dep+secret scan (gitleaks/npm audit, ADR-0014)

## Port mapping (upstream → big-news)

| big-news                                        | astrobiologia (`apps/web-astro/`)                                                                                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/...` (single package)                      | `src/...` (monorepo package)                                                                                                                                                                     |
| `src/lib/adapter/postgres/*`                    | replaces `src/lib/appwrite.ts`, `src/lib/article-read.ts`                                                                                                                                        |
| `src/pages/[...locale]/*` (English route names) | `src/pages/[...locale]/*` (Portuguese names — renamed on port: artigos→articles, categorias→categories, busca→search, sobre→about, contato→contact, privacidade→privacy, configuracoes→settings) |
| dropped                                         | `src/pages/api/admin/redeploy.ts` (Appwrite-specific)                                                                                                                                            |
| added for parity                                | `api/admin/account/{email,password}.ts`                                                                                                                                                          |

## Hosting targets

Node/VPS (default), Docker, Netlify, Vercel, Render, Railway. Local-FS storage is **not** durable on
serverless (Vercel/Netlify) or multi-instance — those require the S3 driver (ADR-0006).
