# Scope — big-news

**Initiative:** Open-source news CMS for small publishers, indie news sites, and self-hosters.

> **Source of truth:** Ported from `danielvm-git/astrobiologia` (owned by the maintainer — MIT relicensing is authorized; astrobiologia ships no LICENSE, big-news adds MIT fresh). The source is a pnpm monorepo at `apps/web-astro/`; **big-news is a single package** (scope decision). Port mapping: `astrobiologia/apps/web-astro/src/X` → `big-news/src/X`. The data layer being replaced is `src/lib/appwrite.ts` + `src/lib/article-read.ts` (`node-appwrite`); everything UI/i18n/editor is reused. Note: categories are a **hardcoded `CATEGORIES` constant** in the source, not a table — big-news keeps category as an article column + shared constant.

---

## Vision

An **open-source news CMS** built with Astro 5+ and PostgreSQL that anyone can deploy. It provides a complete editorial workflow (article CRUD, categories, tags, featured images, multi-language i18n, admin panel, search) while letting you choose your PostgreSQL provider (BigBase, Neon, Supabase, stand-alone) and your hosting (Vercel, Render, Railway, Netlify, Docker, your own server).

A live demo runs at **news.bigbase.click** showcasing the PostgreSQL + BigBase stack.

---

## In Scope

### Data Backend (v1.0)

| Backend                                               | Support     | Notes                                                                                                                                                                                                     |
| ----------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PostgreSQL** (BigBase, Neon, Supabase, stand-alone) | ✅ Only     | Via **`postgres.js`** (TCP, works on VPS/Docker/serverless and every provider) — see [ADR-001](#decisions-adrs)                                                                                           |
| Storage adapter pattern                               | ✅ Required | Thin interface over DB + Auth + Storage. Justified as the **test seam** (mockable) + future-backend hook, NOT a plugin system. Only PostgreSQL shipped in v1.0 — see [ADR-004](#decisions-adrs)           |
| Schema migrations                                     | ✅ Required | Versioned migrations via **`node-pg-migrate`** guarded by a Postgres advisory lock (safe under concurrent multi-instance startup) — see [ADR-002](#decisions-adrs). NOT "run `schema.sql` on every boot". |

### Hosting Support (v1.0)

Any provider supported by Astro adapters:

- **Node** (`@astrojs/node` — standalone server) → default for Docker / VPS / BigBase
- **Netlify** (`@astrojs/netlify`)
- **Vercel** (`@astrojs/vercel`)
- **Render** (Node adapter)
- **Railway** (Node adapter)
- **Docker** (Node adapter + Dockerfile)

> **Storage compatibility:** File uploads use an **S3-compatible** backend by default (works on serverless + multi-instance hosting). Local-filesystem storage is supported **only** as a single-instance/dev convenience and is documented as such. Local FS is NOT durable on Vercel/Netlify (ephemeral) or across multiple instances — see [ADR-006](#decisions-adrs).

### Features (full parity with `astrobiologia`)

#### Public Pages

| Route                             | Description                                     |
| --------------------------------- | ----------------------------------------------- |
| `/`                               | Homepage — featured articles + latest news grid |
| `/[locale]/artigos`               | Article listing (paginated)                     |
| `/[locale]/artigos/[slug]`        | Article detail page                             |
| `/[locale]/categorias/[category]` | Category-filtered listing                       |
| `/[locale]/busca`                 | Search articles                                 |
| `/[locale]/sobre`                 | About page                                      |
| `/[locale]/contato`               | Contact page                                    |
| `/[locale]/privacidade`           | Privacy policy                                  |

#### Admin Panel

| Route                      | Description                       |
| -------------------------- | --------------------------------- |
| `/admin/login`             | Authentication (email/password)   |
| `/admin`                   | Dashboard with stats              |
| `/admin/artigos`           | Article list management           |
| `/admin/artigos/new`       | Create article (rich text editor) |
| `/admin/artigos/[id]/edit` | Edit article                      |
| `/admin/configuracoes`     | Site settings                     |

#### Feature Set

- Article CRUD with TipTap rich text editor
- Multi-language i18n (pt-br, en, es, ja, nl, zh) with locale-based routing
- Article categories and tags
- Featured images (storage backend via adapter)
- Featured / pinned articles
- Draft/published workflow
- Full-text search across articles
- Image upload (S3-compatible storage — see below)
- Responsive design (Tailwind CSS v4)
- SEO metadata per article
- **RSS/Atom feed**, `sitemap.xml`, `robots.txt` (table-stakes for a news site, missing from original parity)
- Custom **404 / 500 error pages**
- **HTML sanitization** of all rich-text content before render (`set:html` is an XSS sink) — see [ADR-005](#decisions-adrs)
- Structured JSON logging + `/api/health` endpoint
- Admin auth (email/password), **seed/CLI-provisioned admin only — no open registration** (see [ADR-003](#decisions-adrs))
- Auth hardening: bcrypt/argon2 hashing, `HttpOnly`+`Secure`+`SameSite=Lax` session cookies, server-side session expiry/rotation, login rate-limiting, CSRF protection on state-changing routes

### Open Source

- **License:** MIT
- **Repository:** `danielvm-git/big-news` on GitHub
- **Demo:** `news.bigbase.click`
- **Documentation:** README with install → configure → deploy flow for each supported backend and hosting provider

### Testing

- **Unit:** Vitest for lib utilities and API routes
- **E2E:** Playwright for critical user flows (public browse, admin CRUD, auth)
- **Typecheck:** `astro check` + `tsc --noEmit`

### CI / Quality

- GitHub Actions: typecheck → lint → unit tests → **integration tests (against a Postgres service container)** → build → **E2E (Playwright, seeded ephemeral Postgres)**
- Conventional Commits (commitlint + Husky)
- semantic-release for version bumps
- Prettier for formatting
- **Verification standard:** every story's gate is its Gherkin scenarios implemented as runnable tests (vitest/Playwright). `grep`/`test -f` are scaffolding sanity checks only, never the acceptance gate — see [ADR-007](#decisions-adrs)

---

## Out of Scope (v1.0)

| Item                          | Rationale                                          |
| ----------------------------- | -------------------------------------------------- |
| Multi-tenancy                 | Too complex for v1; each instance manages one site |
| Social login (GitHub, Google) | Email/password only; community can add             |
| Comments / discussion         | Focus on CMS core; community plugin                |
| Newsletter / subscription     | Not core CMS; add via third-party                  |
| Podcast / video management    | Text-first news CMS                                |
| Mobile app / PWA              | Web-first; Astro can add PWA later                 |
| Plugin system                 | Premature abstraction; v1 focuses on PostgreSQL    |
| Real-time (SSE, WebSocket)    | Not needed for news CMS                            |

---

## Constraints

- **Astro 5+** only (no v4 backwards compat)
- **ESM-only** (no CommonJS)
- **Node 22+** runtime
- All env vars via environment, NEVER committed to repo
- Conventional Commits enforced by commitlint + Husky
- `apps/web` single package (no monorepo — simpler for community)
- **MIT license**
- Zero external secrets in codebase

---

## Success Criteria

1. Live demo running at `news.bigbase.click` with PostgreSQL backend
2. Admin (provisioned via seed/CLI) can login → create article → publish → view public → edit → logout. **No public registration route exists.**
3. Unauthenticated requests to `/admin/*` redirect to `/admin/login`; unauthenticated `/api/admin/*` return `401`
4. Full feature parity with original `astrobiologia` codebase, **plus** RSS/sitemap/robots and sanitized content
5. README documents install + deploy for PostgreSQL with: BigBase, Neon, Supabase, stand-alone
6. README documents deploy for: Node/VPS, Docker, Netlify, Vercel, Render, Railway
7. All Vitest + Playwright tests pass in CI
8. MIT license, public repo at `danielvm-git/big-news`
9. Version tag `v1.0.0` created when MVP is complete

---

## Decisions (ADRs)

| #           | Decision                                                                                                                                | Rationale                                                                                                                                                                                                                                                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ADR-001** | DB driver: **`postgres.js`** (single driver)                                                                                            | TCP works on VPS/Docker/standalone/serverless and every provider (BigBase/Neon/Supabase). Avoids the unresolved "`@neondatabase/serverless` _or_ `postgres.js`" fork. Node adapter is the default target, so no edge-driver need in v1.                                                                                                               |
| **ADR-002** | Migrations via **`node-pg-migrate`** + Postgres **advisory lock** on startup                                                            | Versioned, reversible schema evolution. Advisory lock prevents concurrent-instance migration races. Replaces "run `schema.sql` every boot".                                                                                                                                                                                                           |
| **ADR-003** | **No open registration.** First admin via `scripts/seed.ts` / CLI; subsequent admins created from within the panel by an existing admin | A self-hosted CMS with a public register route lets anyone mint admin accounts. Removes that attack surface.                                                                                                                                                                                                                                          |
| **ADR-004** | Keep a **thin** storage-adapter interface, shipping one (Postgres) impl                                                                 | Justified as the **test seam** (mock in unit/API tests, mirroring astrobiologia's `mock-appwrite.ts`) and a future-backend hook. Not a plugin system (which remains out of scope).                                                                                                                                                                    |
| **ADR-005** | **Sanitize** all rich-text HTML server-side before persistence/render (`sanitize-html`, allowlist)                                      | `set:html` is a stored-XSS sink; TipTap/DeepL output is untrusted. Sanitize on write so stored content is always clean.                                                                                                                                                                                                                               |
| **ADR-006** | **S3-compatible** storage is the default; local FS is dev/single-instance only                                                          | Local FS breaks on Vercel/Netlify (ephemeral) and multi-instance. S3-compatible (incl. MinIO, R2, BigBase storage) works everywhere.                                                                                                                                                                                                                  |
| **ADR-007** | Story gate = **Gherkin scenarios as runnable tests**; `grep`/`test -f` are sanity checks only                                           | `grep -q 'fn'` passes on a stub that throws. Behavioral tests are the real gate, closing the false-positive hole in the routing architecture's verification step.                                                                                                                                                                                     |
| **ADR-008** | **DeepL translation is optional**, gated on `DEEPL_API_KEY`                                                                             | No paid/network hard-dependency for core CMS. Button hidden when unset; tests mock the DeepL client.                                                                                                                                                                                                                                                  |
| **ADR-009** | **Content-Security-Policy + standard security headers** on every response (via middleware)                                              | Defense-in-depth behind sanitization for a `set:html` CMS. Includes CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS, `frame-ancestors 'none'`.                                                                                                                                                                                        |
| **ADR-010** | **Uploads are re-encoded, content-sniffed, and served untrusted**                                                                       | MIME is client-asserted, so validate by magic bytes, re-encode raster images (strips EXIF/polyglot payloads), sanitize filenames (no traversal), enforce size cap before buffering, **block SVG**. User files served from a separate origin or with `Content-Disposition: attachment` + fixed `Content-Type` so they can't execute in the app origin. |
| **ADR-011** | **All DB access is parameterized; no interpolated identifiers**                                                                         | `postgres.js` tagged templates only. Dynamic `ORDER BY`/pagination map through allowlists, never string concat. Enforced by a query-safety lint/test.                                                                                                                                                                                                 |
| **ADR-012** | **Sessions rotate on login and are mass-invalidated on credential change**                                                              | Rotate session id at login (anti-fixation); destroy all of a user's sessions on password/email change; enforce both idle and absolute timeouts.                                                                                                                                                                                                       |
| **ADR-013** | **Rate limiting is shared-state (DB-backed), not per-instance memory**                                                                  | big-news now supports multi-instance/serverless hosting where in-memory limits are bypassed by hitting different instances. Login/translate/upload throttles persist in Postgres.                                                                                                                                                                     |
| **ADR-014** | **CI runs dependency + secret scanning**                                                                                                | `npm audit` (or Dependabot) and `gitleaks` in the pipeline; generic API error messages (no DB/schema text) so failures don't leak internals.                                                                                                                                                                                                          |
| **ADR-015** | **Schema-based input validation at every API boundary** (`zod`)                                                                         | Distinct from output sanitization (ADR-005). Every route parses request body/query/params through a schema and rejects invalid input with `400` before any logic. Directly addresses the conference "found missing input validation → add schema check" practice.                                                                                     |
| **ADR-016** | **Least-privilege runtime credentials**                                                                                                 | The app connects with a Postgres role that has only DML on its own tables (no superuser/DDL at runtime; migrations use a separate role). S3 keys are scoped to one bucket with no list/delete beyond need. Secrets injected via env, never committed. Mirrors the conference "least-privilege service account" step.                                  |
| **ADR-017** | **`/security-review` is a mandatory pre-deploy gate**                                                                                   | Run on the diff before every release (and re-run after edits) — human + tool review. "Nothing ships without my review." Findings are fixed and re-reviewed before Epic 8 deploys.                                                                                                                                                                     |
| **ADR-018** | **Observability is foundational, not polish**                                                                                           | Structured logging + request-ID + redaction land in Epic 1 so every later module instruments as it is written (no retrofit). Health/readiness endpoints land with the data layer. Metrics/tracing are explicitly out of scope for v1.                                                                                                                 |

## Delivery Method (Claude Code lifecycle)

big-news is delivered using the **Prototype → Design → Build → Deploy → Support** lifecycle with **Claude Code = Memory + Tools + Subagents + Skills + MCP**:

- **Memory** — `CLAUDE.md` + `CONVENTIONS.md` + `specs/` are the durable project memory every agent reads.
- **Skills** — the bigpowers lifecycle skills (`kickoff-branch`, `plan-work`, `develop-tdd`, `verify-work`, `security-review`, `wire-observability`, `release-branch`) drive each phase.
- **Subagents** — the **Build** phase uses an orchestrator + one subagent per parallel lane (see release-plan execution order): backend/data, public-site, admin-panel built concurrently, then integrated.
- **MCP / Tools** — Design fidelity is inherited from astrobiologia (the "wireframe → code" step is already done); a Figma MCP is the path for _future_ net-new design. Deploy/ops use CLI tools (`gh`, `psql`, `docker`, host CLI).
- **Prototype/Design** are largely satisfied by the existing astrobiologia UI; big-news re-verifies **visual parity** rather than re-designing. **Support** is a first-class post-launch phase (see Epic 9).
