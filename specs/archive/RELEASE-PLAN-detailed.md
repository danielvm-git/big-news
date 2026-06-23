# Release Plan — big-news

**Open-source PostgreSQL news CMS** — v1.0.0

Built from `danielvm-git/astrobiologia` (Astro 5+ / Appwrite → Astro 5+ / PostgreSQL). Every epic ports an existing feature to the new PostgreSQL-backed architecture.

> **This plan supersedes the original.** It closes the gaps found in red-team review. Key structural changes vs. the first draft:
>
> 1. **i18n locale routing is now foundational (Epic 1)**, not a late bolt-on — the source already ships pages under `src/pages/[...locale]/`, so all public pages are built there from the start (no Epic-4 rework).
> 2. **Storage defaults to S3-compatible** (ADR-006); local FS is dev-only.
> 3. **Auth is hardened** (CSRF, rate-limit, cookie flags, seed-only admin — ADR-003) and there is **no public registration**.
> 4. **Migrations** use `node-pg-migrate` + advisory lock (ADR-002), not boot-time `schema.sql`.
> 5. **Verification standard (ADR-007):** every story's _gate_ is its Gherkin scenarios run as tests. The `→ verify:` shell snippets are scaffolding sanity checks only; the **Gate:** line is the real acceptance command.
> 6. Added stories for **sanitization, RSS/sitemap/robots, error pages, observability, test infrastructure, deploy rollback**, and the repo goes **public at the end of Epic 1** (not Epic 8).

---

## Port Mapping & Source of Truth

| big-news                                               | astrobiologia source                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `src/...` (single package)                             | `apps/web-astro/src/...` (monorepo)                                                  |
| `src/lib/adapter/postgres/*` (new)                     | replaces `src/lib/appwrite.ts`, `src/lib/article-read.ts`                            |
| `src/pages/[...locale]/*`                              | `src/pages/[...locale]/*` (unchanged shape)                                          |
| `src/lib/{locale,article-locales,article-editor-*}.ts` | same files (UI/i18n/editor reused as-is)                                             |
| categories                                             | hardcoded `CATEGORIES` constant (ported as `src/lib/categories.ts`, **not** a table) |

Confirmed source deps to mirror: `astro@^5.9`, `@astrojs/node@^9`, `@astrojs/react@^4`, `react@19`, `tailwindcss@4`, `@tiptap/*@3`, `cookie@^1`, `vitest@3`, `@playwright/test`, `playwright-bdd`. New for big-news: `postgres` (postgres.js), `node-pg-migrate`, `bcrypt`/`argon2`, `sanitize-html`, `@aws-sdk/client-s3`.

---

## Verification Standard (ADR-007)

Each task carries a quick `→ verify:` sanity check (file/string exists). **These are not acceptance gates** — a `grep` passes on a stub that throws. Each _story_ ends with a **Gate:** line: the Gherkin scenarios implemented as runnable tests. A story is "done" only when its Gate passes in CI. Directory greps use `grep -rq`; never `grep -q PATTERN dir/` (errors on a directory).

---

## Delivery Method — bigpowers 8-Step Epic Cycle

This plan is executed using the **bigpowers skill set** — each epic runs through the **`build-epic`** 8-step cycle:

| Step | Skill / Action   | Description                                        |
| ---- | ---------------- | -------------------------------------------------- |
| 1    | `survey-context` | Confirm epic + story, read state                   |
| 2    | `plan-work`      | Flesh out story tasks in epic capsule              |
| 3    | `kickoff-branch` | Feature branch + clean test baseline               |
| 4    | `develop-tdd`    | Red-green-refactor per task                        |
| 5    | `verify-work`    | UAT + mechanical gates (Gherkin scenarios)         |
| 6    | `audit-code`     | **Non-optional gate** — fail → loop back to step 4 |
| 7    | `commit-message` | Conventional Commits draft                         |
| 8    | `release-branch` | PR or solo land with squash                        |

**Tracking:** `specs/state.yaml` tracks `active_flow`, `active_epic`, `epic_cycle.current_step`. `specs/execution-status.yaml` marks stories `done`. Both are created in Epic 1.

**Parallel build (Epics 4–6):** after Epic 3, the orchestrator dispatches three subagents running the same 8-step cycle concurrently:

```
                 Claude Code (Orchestrator)
        ┌──────────────────┼──────────────────┐
   Subagent A          Subagent B          Subagent C
   public-site (E4)    admin-panel (E5)    i18n+polish (E6/E7)
        └──────────────────┴──────────────────┘  → integrate (E8)
```

Each subagent works the same Definition of Done and pushes through CI; the orchestrator owns integration + the `/security-review` gate.

**Cross-cutting skills used across epics:**

- `seed-conventions` — bootstrap CLAUDE.md, CONVENTIONS.md, specs/ (Epic 1)
- `hook-commits` — Husky + lint-staged + commit-time checks (Epic 1)
- `wire-ci` — generate GitHub Actions with templates + validate (Epic 1)
- `wire-observability` — structured JSON logging (Epic 1)
- `develop-tdd` — TDD per story (Epics 2–8)
- `verify-work` — UAT gate after each story (all epics)
- `audit-code` — mandatory self-review before commit (all epics)
- `deploy` + `smoke-test` — deploy pipeline (Epic 8)

---

## Epic 1: Foundation & Scaffold

Priority: **P1** | Value: High | Effort: M | WSJF: **9.0** | Parallel lane: none (blocks all)

### Story 1.1: Initialize Astro 5+ project with i18n

As a **developer**, I want a working Astro 5+ scaffold with TypeScript, React, Tailwind v4, **and i18n locale routing configured from day one** so every later page is built in the right place.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Project Scaffold
  Scenario: Dev server starts
    Given an Astro 5+ project with TypeScript, React, Tailwind CSS v4
    When I run `pnpm dev`
    Then the dev server starts on localhost:4321

  Scenario: SSR build succeeds
    When I run `pnpm build`
    Then it produces a server build in `dist/`

  Scenario: TypeScript compiles
    When I run `pnpm typecheck`
    Then no type errors are reported

  Scenario: i18n routing is configured
    Given astro.config.mjs
    Then i18n.defaultLocale is "en" with v1 locales [en, pt-br] (es/ja/nl/zh deferred, ADR-0020)
    And routing.prefixDefaultLocale is false
```

**Tasks:**

- [ ] `pnpm create astro@latest` (single package, not monorepo) → verify: `test -f package.json && grep -q '"astro"' package.json`
- [ ] `npx astro add react` → verify: `grep -q '@astrojs/react' package.json`
- [ ] Add Tailwind v4 via `@tailwindcss/vite` (mirror source: not the legacy integration) → verify: `grep -q '@tailwindcss/vite' package.json`
- [ ] Configure `astro.config.mjs`: `output: "server"`, `@astrojs/node` standalone adapter, **and `i18n` block** (`defaultLocale: "en"`, v1 locales `[en, pt-br]`, `prefixDefaultLocale: false`) → verify: `grep -q 'i18n' astro.config.mjs && grep -q 'output: "server"' astro.config.mjs`
- [ ] Port locale helpers now (foundational): `src/lib/locale.ts`, `src/lib/article-locales.ts`, `src/lib/categories.ts` → verify: `grep -q 'normalizeLocaleTag' src/lib/locale.ts && grep -q 'ARTICLE_LOCALES' src/lib/article-locales.ts`
- [ ] Strict `tsconfig.json`; `src/styles/main.css` with Tailwind → verify: `grep -q 'strict' tsconfig.json && test -f src/styles/main.css`

**Gate:** `pnpm typecheck && pnpm build` succeed; `node -e "/* assert astro.config i18n */"` (or a vitest config test) confirms the v1 locales `[en, pt-br]`.

---

### Story 1.2: Development toolchain (use `hook-commits`)

As a **developer**, I want Husky, commitlint, Prettier, and semantic-release so the project enforces conventional commits and consistent formatting.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Dev Toolchain
  Scenario: Commit message is validated
    When I commit with a non-conventional message
    Then the commit is rejected
  Scenario: Prettier formats code
    When I run `pnpm format`
    Then all files are formatted
  Scenario: Semantic-release can version
    When I run `pnpm semantic-release --dry-run`
    Then it prints the next version without publishing
```

**Tasks:**

- [ ] Install devDependencies: `husky`, `lint-staged`, `prettier`, `commitlint`, `semantic-release`, `@semantic-release/changelog`, `@semantic-release/git` → verify: `grep -q '"semantic-release"' package.json && grep -q '@semantic-release/changelog' package.json && grep -q '@semantic-release/git' package.json`
- [ ] Run **`hook-commits`** skill to set up Husky + lint-staged + pre-commit hooks → verify: `test -f .husky/pre-commit`
- [ ] Manually configure commitlint (conventional config) → verify: `test -f commitlint.config.js`
- [ ] Manually configure Prettier → verify: `test -f .prettierrc`
- [ ] Configure `.releaserc` with plugins: `@semantic-release/commit-analyzer`, `@semantic-release/release-notes-generator`, `@semantic-release/changelog` (generates CHANGELOG.md), `@semantic-release/github`, `@semantic-release/git` (commits CHANGELOG.md and tag back) → verify: `grep -q 'changelog' .releaserc && grep -q 'git' .releaserc`
- [ ] Set `package.json` version to `"0.0.0"` (first `feat:` commit produces `v0.1.0`) → verify: `grep -q '"version": "0.0.0"' package.json`
- [ ] Set `engines.node` to `>=22` → verify: `grep -q '"node": ">=22"' package.json`
- [ ] `package.json` scripts: `format`, `typecheck`, `test:unit`, `test:integration`, `test:e2e`, `preflight` → verify: `grep -q '"preflight"' package.json && grep -q '"test:integration"' package.json`
- [ ] `.env.example` documenting **every** env var: `DATABASE_URL`, session secret, `S3_*`, optional `DEEPL_API_KEY`, `PUBLIC_SITE_URL` → verify: `grep -q 'DATABASE_URL' .env.example && grep -q 'S3_' .env.example`
- [ ] `.gitignore` (env, dist, node_modules, uploads) → verify: `grep -q '.env' .gitignore`

**Gate:** `pnpm format --check` passes; a deliberate bad commit message is rejected by the hook; the first `feat:` commit produces `v0.1.0` with auto-generated `CHANGELOG.md` when `pnpm semantic-release --dry-run --no-ci` shows the next version.

---

### Story 1.3: Conventions & specs (use `seed-conventions`)

As a **developer**, I want CLAUDE.md, CONVENTIONS.md, and specs/ so agents and contributors follow consistent practices.

- **Status:** [ ] Not started

**Tasks:**

- [ ] Run **`seed-conventions`** skill to bootstrap CLAUDE.md, CONVENTIONS.md, specs/ directory → verify: `test -f CLAUDE.md && test -f CONVENTIONS.md`
- [ ] Review generated CLAUDE.md — ensure dev/build/test/typecheck commands match project → verify: `grep -q 'pnpm' CLAUDE.md`
- [ ] Review generated CONVENTIONS.md — ensure it captures: ESM-only, Node 22+, adapter pattern, no secrets, sanitize-on-write rule, **English-only project (code/identifiers/comments/routes/strings/docs) — ADR-0020** → verify: `grep -qi 'english' CONVENTIONS.md`
- [ ] Create `specs/state.yaml` with initial state (bigpowers cockpit) → verify: `grep -q 'active_flow' specs/state.yaml`
- [ ] Create `specs/execution-status.yaml` for story tracking → verify: `test -f specs/execution-status.yaml`
- [ ] Confirm `specs/SCOPE.md`, `specs/RELEASE-PLAN.md` → verify: `test -f specs/SCOPE.md && test -f specs/RELEASE-PLAN.md`

**Gate:** docs reviewed; commands in CLAUDE.md actually run; `state.yaml` is valid YAML.

---

### Story 1.4: License, repo, and CI (use `wire-ci`)

As a **maintainer**, I want the public repo created early and CI that runs the _full_ test pyramid, so the project is backed up from day one and regressions are caught — including integration and E2E.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: CI Pipeline
  Scenario: PR runs the full pyramid
    Given a PR against main
    Then CI runs: typecheck, lint, unit, integration (Postgres service), build, E2E (Playwright + seeded Postgres)
    And all must pass before merge
  Scenario: Integration tests have a database
    Given the CI integration job
    Then a postgres:16 service container is available at DATABASE_URL
```

**Tasks:**

- [ ] `LICENSE` (MIT) and `CONTRIBUTING.md` **now** (moved earlier from Epic 7) → verify: `grep -q 'MIT' LICENSE && test -f CONTRIBUTING.md`
- [ ] Create **public** GitHub repo `danielvm-git/big-news`, push `main` → verify: `gh repo view danielvm-git/big-news --json visibility -q .visibility | grep -q PUBLIC`
- [ ] Run **`wire-ci`** skill to generate `.github/workflows/ci.yml` with Astro + Postgres + Playwright templates → verify: `grep -q 'postgres' .github/workflows/ci.yml && grep -q 'playwright' .github/workflows/ci.yml`
- [ ] Run `wire-ci --validate` to check workflow YAML syntax and permissions → verify: workflow validates
- [ ] Add integration job with `services: postgres:16`, `DATABASE_URL` env → verify: `grep -q 'services:' .github/workflows/ci.yml`
- [ ] `.github/workflows/release.yml` (semantic-release on main) → verify: `test -f .github/workflows/release.yml`
- [ ] Node 22 engine → verify: `grep -q '"node": ">=22"' package.json`

**Gate:** A trivial PR turns the full CI matrix green (all 6 jobs).

---

### Story 1.5: Test infrastructure (real Postgres + adapter mock)

As a **developer**, I want a repeatable way to run integration tests against a real Postgres and unit tests against a mocked adapter, so tests are fast locally and deterministic in CI.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Test Infra
  Scenario: Integration DB spins up
    When I run `pnpm test:integration`
    Then a disposable Postgres is available, migrated, and torn down
  Scenario: Unit tests mock the adapter
    When I run `pnpm test:unit`
    Then no database connection is required
```

**Tasks:**

- [ ] `docker-compose.test.yml` (or Testcontainers) providing disposable Postgres 16 → verify: `test -f docker-compose.test.yml`
- [ ] `src/lib/adapter/__tests__/mock-adapter.ts` in-memory `StorageAdapter` (mirrors source `mock-appwrite.ts`) → verify: `grep -q 'StorageAdapter' src/lib/adapter/__tests__/mock-adapter.ts`
- [ ] vitest projects: `unit` (mock) and `integration` (real DB) → verify: `grep -q 'integration' vitest.config.ts || grep -q 'integration' vitest.workspace.ts`

**Gate:** `pnpm test:unit` runs with no DB; `pnpm test:integration` migrates a throwaway DB and passes a smoke query.

---

### Story 1.6: Foundational observability & input-validation primitives (ADR-018, ADR-015)

As a **developer**, I want structured logging and a request-validation helper to exist _before_ any feature code, so every module instruments and validates from line one (no retrofit). Use the **`wire-observability`** skill for the logging half.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Foundational Logging
  Scenario: Structured JSON logs with a request id
    Given a request flows through middleware
    Then logs are JSON with a correlation/request id, level, route, status, and latency
  Scenario: Secrets are redacted
    Given a log call includes a cookie, Authorization header, or DATABASE_URL
    Then those values are redacted in the output
  Scenario: Level is configurable
    Given LOG_LEVEL=warn
    Then info logs are suppressed

Feature: Input Validation Helper
  Scenario: Invalid body is rejected with 400
    Given an API route guarded by a zod schema
    When the body fails the schema
    Then it returns 400 with a safe, generic error (no internals)
  Scenario: Valid body is typed
    When the body passes
    Then the handler receives a typed, parsed object
```

**Tasks:**

- [ ] `src/lib/logger.ts` — structured JSON logger, `LOG_LEVEL` env, built-in redaction allowlist (cookies/auth/conn strings) → verify: `grep -q 'redact' src/lib/logger.ts`
- [ ] Request-ID assignment + request-completion logging wired in `src/middleware/index.ts` (created here, reused by Epic 3) → verify: `grep -q 'requestId\|x-request-id' src/middleware/index.ts`
- [ ] `src/lib/validation.ts` — install `zod`; export a `validate(schema, input)` + a route helper returning `400` on failure via `src/lib/errors.ts` (generic messages) → verify: `grep -q 'zod' package.json && grep -q 'validate' src/lib/validation.ts`
- [ ] Add `CONVENTIONS.md` rules: no `console.*`; every API route validates input via a schema → verify: `grep -q 'validate' CONVENTIONS.md`

**Gate:** `pnpm test:unit run src/lib/__tests__/{logger,validation}.test.ts` — covers redaction, level filtering, 400-on-invalid, and typed-pass.

---

### Story 1.7: BigBase-style footer (3-column + version bar)

As a **visitor/maintainer**, I want a footer matching the exact design from **bigbase.click** — 3-column grid with Product/Resources/Community links, and a bottom bar with copyright, license, version, and "Built with BigPowers by danielvm-git" — so the site feels part of the same family.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: BigBase-style Footer
  Scenario: Footer matches BigBase layout
    Given the site's footer
    Then it has a 3-column grid layout with columns: Product, Resources, Community
    And a bottom bar separated by a border

  Scenario: Product column links
    Given the Product column
    Then it lists: Artigos, Categorias, Sobre, Contato (or equivalent site pages)

  Scenario: Resources column links
    Given the Resources column
    Then it links to: Documentation (GitHub README), Changelog, Source Code (GitHub repo)

  Scenario: Community column links
    Given the Community column
    Then it links to: GitHub, Issues, Discussions

  Scenario: Bottom bar shows version
    Given the build process injects PUBLIC_APP_VERSION from package.json
    When I view the footer
    Then it shows "© {year} big-news · MIT License · v{PUBLIC_APP_VERSION}"

  Scenario: Bottom bar shows built with credit
    Given the footer
    Then it shows "Built with BigPowers by danielvm-git" with links

  Scenario: Version is injected at build time
    Given the build process
    Then version comes from `import.meta.env.PUBLIC_APP_VERSION` (set via Astro Vite `define`),
      which reads `version` from `package.json` at build time
    So that every semantic-release bump auto-updates the footer
```

**Exact HTML structure (port from BigBase):**

```html
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-col">
      <h4>Product</h4>
      <ul>
        <li><a href="/articles">Artigos</a></li>
        <li><a href="/categories">Categorias</a></li>
        <li><a href="/about">Sobre</a></li>
        <li><a href="/contact">Contato</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Resources</h4>
      <ul>
        <li>
          <a
            href="https://github.com/danielvm-git/big-news"
            target="_blank"
            rel="noreferrer"
            >Documentation</a
          >
        </li>
        <li>
          <a
            href="https://github.com/danielvm-git/big-news/blob/main/CHANGELOG.md"
            target="_blank"
            rel="noreferrer"
            >Changelog</a
          >
        </li>
        <li>
          <a
            href="https://github.com/danielvm-git/big-news"
            target="_blank"
            rel="noreferrer"
            >Source Code</a
          >
        </li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Community</h4>
      <ul>
        <li>
          <a
            href="https://github.com/danielvm-git/big-news"
            target="_blank"
            rel="noreferrer"
            >GitHub</a
          >
        </li>
        <li>
          <a
            href="https://github.com/danielvm-git/big-news/issues"
            target="_blank"
            rel="noreferrer"
            >Issues</a
          >
        </li>
        <li>
          <a
            href="https://github.com/danielvm-git/big-news/discussions"
            target="_blank"
            rel="noreferrer"
            >Discussions</a
          >
        </li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span
      >&copy; {year} big-news &middot; MIT License &middot;
      v{PUBLIC_APP_VERSION}</span
    >
    <span
      >Built with
      <a
        href="https://github.com/danielvm-git/bigpowers"
        target="_blank"
        rel="noreferrer"
        >BigPowers</a
      >
      by
      <a href="https://github.com/danielvm-git" target="_blank" rel="noreferrer"
        >danielvm-git</a
      ></span
    >
  </div>
</footer>
```

**Exact CSS (port from BigBase, uses CSS variables defined in `src/styles/main.css`):**

```css
.footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: var(--space-48) var(--space-24) var(--space-24);
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-32);
}
.footer-col h4 {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-fg-tertiary);
  margin-bottom: var(--space-12);
}
.footer-col ul {
  list-style: none;
}
.footer-col li {
  margin-bottom: var(--space-6);
}
.footer-col a {
  font-size: 0.8rem;
  color: var(--color-fg-secondary);
  text-decoration: none;
}
.footer-col a:hover {
  color: var(--color-fg);
}
.footer-bottom {
  max-width: 1200px;
  margin: var(--space-32) auto 0;
  padding-top: var(--space-16);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-fg-tertiary);
}
@media (max-width: 768px) {
  .footer-inner {
    grid-template-columns: 1fr;
  }
  .footer-bottom {
    flex-direction: column;
    gap: var(--space-8);
    text-align: center;
  }
}
```

**Tasks:**

- [ ] Define CSS variables in `src/styles/main.css` matching BigBase's design tokens (—color-fg, —color-fg-secondary, —color-fg-tertiary, —color-border, —color-surface, —space-\* scale) → verify: `grep -q '--color-fg' src/styles/main.css`
- [ ] Create build-time version injection: In `astro.config.mjs`, use `vite.define` to set `import.meta.env.PUBLIC_APP_VERSION` from `package.json` → verify: `grep -q 'PUBLIC_APP_VERSION' astro.config.mjs`
- [ ] Create `src/components/Footer.astro` with the exact BigBase HTML structure (3 columns + bottom bar) adapted for big-news → verify: `grep -q 'footer-inner' src/components/Footer.astro && grep -q 'footer-bottom' src/components/Footer.astro`
- [ ] Add the BigBase CSS to `src/styles/main.css` under the `.footer`, `.footer-inner`, `.footer-col`, `.footer-bottom` classes → verify: `grep -q '.footer {' src/styles/main.css`
- [ ] Apply the footer in the base layout (`src/layouts/Base.astro` or equivalent) so it appears on every page → verify: `grep -rq 'Footer' src/layouts/`
- [ ] Verify CHANGELOG.md is generated (semantic-release `@semantic-release/changelog` plugin) and linked from the Resources column → verify: Changelog link points to GitHub blob

**Gate:** `pnpm build && pnpm preview` shows the exact BigBase footer layout with correct version from `package.json`. CSS match — 3 columns on desktop, single column on mobile, bottom bar with copyright + version + credits.

---

## Epic 2: PostgreSQL Data Layer

Priority: **P1** | Value: High | Effort: L | WSJF: **6.0** | Parallel lane: A (blocks 3,4,5)

### Story 2.1: Storage adapter interface (the test seam)

As a **developer**, I want a thin TypeScript interface for DB, Auth, and Storage so the Postgres implementation has a contract and tests can mock it (ADR-004).

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Storage Adapter Interface
  Scenario: Article methods exist
    Then it defines createArticle, getArticle, updateArticle, deleteArticle, listArticles,
      getArticleBySlug, getPublishedArticles, getFeaturedArticles, getArticlesByCategory, searchArticles
  Scenario: Translation methods exist
    Then it defines createTranslation, getTranslations, updateTranslation, deleteTranslation
  Scenario: Auth methods exist
    Then it defines createUser, authenticateUser, createSession, validateSession, destroySession, getUser
  Scenario: Storage methods exist
    Then it defines uploadFile, getFileUrl, deleteFile
  Scenario: Settings methods exist
    Then it defines getSettings, updateSettings
```

**Tasks:**

- [ ] `src/lib/adapter/types.ts` with sub-adapter interfaces + composed `StorageAdapter` → verify: `grep -q 'interface StorageAdapter' src/lib/adapter/types.ts`
- [ ] Domain types `ArticleData`, `TranslationData`, `UserData`, `SettingsData` (no Appwrite `$id`/`$createdAt`) → verify: `grep -q 'interface ArticleData' src/lib/adapter/types.ts`
- [ ] Make `mock-adapter.ts` from Story 1.5 implement the interface → verify: `pnpm test:unit run src/lib/adapter/__tests__/types.test.ts`

**Gate:** the mock adapter type-checks against `StorageAdapter`; interface contract test passes.

---

### Story 2.2: PostgreSQL connection (postgres.js)

As a **developer**, I want a `postgres.js` connection module (ADR-001) so the app connects to any provider over TCP.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: PostgreSQL Connection
  Scenario: Connection succeeds with valid env
    Given DATABASE_URL is set
    When I initialize the client
    Then a connection is established and `SELECT 1` returns 1
  Scenario: Missing env fails fast
    Given DATABASE_URL is not set
    When I initialize the client
    Then a clear error names the missing variable
```

**Tasks:**

- [ ] Install `postgres` → verify: `grep -q '"postgres"' package.json`
- [ ] `src/lib/adapter/postgres/connection.ts` (singleton, SSL-aware for hosted providers) → verify: `test -f src/lib/adapter/postgres/connection.ts`

**Gate:** `pnpm test:integration run .../connection.test.ts` connects, runs `SELECT 1`, and asserts the fail-fast error when `DATABASE_URL` is unset.

---

### Story 2.3: Schema + versioned migrations (node-pg-migrate)

As a **developer**, I want versioned, advisory-lock-guarded migrations (ADR-002) for articles, translations, users, settings, sessions.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Migrations
  Scenario: Migrations create all tables
    When migrations run
    Then tables exist: articles, article_translations, users, settings, sessions, pgmigrations
  Scenario: Articles columns
    Then articles has id, category, tags, featured_image, featured_image_alt, status,
      featured, author_id, author_name, published_at, created_at, updated_at
  Scenario: Translation columns + cascade
    Then article_translations has id, article_id (FK ON DELETE CASCADE), language, title, slug,
      excerpt, content, meta_title, meta_description
  Scenario: Full-text search index
    Then article_translations has a GIN index over to_tsvector(title||excerpt||content)
  Scenario: Concurrent startup is safe
    Given two instances boot simultaneously
    When both attempt to migrate
    Then an advisory lock serializes them and the schema is applied exactly once
```

**Tasks:**

- [ ] Install `node-pg-migrate`; `migrations/` dir with first migration → verify: `grep -q 'node-pg-migrate' package.json && test -d migrations`
- [ ] GIN tsvector index migration → verify: `grep -rq 'GIN\|to_tsvector' migrations/`
- [ ] `src/lib/adapter/postgres/migrate.ts` runs `node-pg-migrate up` under `pg_advisory_lock` → verify: `grep -q 'advisory' src/lib/adapter/postgres/migrate.ts`
- [ ] `pnpm migrate` / `pnpm migrate:down` scripts → verify: `grep -q '"migrate"' package.json`

**Gate:** `pnpm test:integration run .../migrate.test.ts` applies migrations, asserts all tables/columns/index, rolls back cleanly, and a concurrent double-run test produces one schema.

---

### Story 2.4: PostgreSQL article adapter

As a **developer**, I want article CRUD + queries backed by Postgres.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Article Adapter
  Scenario: Create returns id + timestamps
  Scenario: Publish makes article visible in published queries
  Scenario: List published returns 10 of 25 ordered by publishedAt DESC
  Scenario: Get by slug returns the right article (locale-aware translation pick)
  Scenario: Pagination — page 1 limit 10 of 30 returns 10 + total 30
  Scenario: Delete cascades to translations
  Scenario: searchArticles uses full-text search and ranks matches
```

**Tasks:**

- [ ] `src/lib/adapter/postgres/article-adapter.ts` implementing `ArticleAdapter` → verify: `grep -q 'ArticleAdapter' src/lib/adapter/postgres/article-adapter.ts`
- [ ] `createArticle`/`updateArticle` with translation upsert; `deleteArticle` (cascade) → verify: `grep -q 'createArticle' src/lib/adapter/postgres/article-adapter.ts`
- [ ] Listing/filter/featured/category methods → verify: `grep -q 'getPublishedArticles' src/lib/adapter/postgres/article-adapter.ts`
- [ ] `searchArticles` (tsquery, ranked) → verify: `grep -q 'searchArticles' src/lib/adapter/postgres/article-adapter.ts`
- [ ] Port locale-aware translation-pick logic from source `article-read.ts` → verify: `grep -q 'pickTranslation' src/lib/adapter/postgres/article-adapter.ts`

**Gate:** `pnpm test:integration run .../article-adapter.test.ts` covers every scenario above against a real DB.

---

### Story 2.5: Settings adapter

As an **admin**, I want site settings (siteName, tagline, description) in Postgres.

- **Status:** [ ] Not started

**Tasks:**

- [ ] `src/lib/adapter/postgres/settings-adapter.ts` (single-row upsert) → verify: `grep -q 'getSettings' src/lib/adapter/postgres/settings-adapter.ts`

**Gate:** `pnpm test:integration run .../settings-adapter.test.ts` — save then retrieve round-trips.

---

### Story 2.6: S3-compatible storage adapter (ADR-006)

As an **admin**, I want uploads stored in S3-compatible object storage so images work on serverless/multi-instance hosting; local FS is a dev fallback.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: File Storage
  Scenario: Upload to S3-compatible backend
    Given S3_* env is configured
    When I upload a valid image
    Then it is stored and getFileUrl returns a public URL
  Scenario: Local FS fallback (dev)
    Given STORAGE_DRIVER=local
    When I upload an image
    Then it is written under ./uploads and served via /uploads
  Scenario: Delete removes the object
  Scenario: Non-image / oversized upload is rejected
```

**Tasks:**

- [ ] `src/lib/adapter/postgres/storage-adapter.ts` with **S3 driver (default)** via `@aws-sdk/client-s3` + **local driver** selectable by `STORAGE_DRIVER` → verify: `grep -q 'uploadFile' src/lib/adapter/postgres/storage-adapter.ts && grep -q 'S3' src/lib/adapter/postgres/storage-adapter.ts`
- [ ] MIME/size validation → verify: `grep -q 'image/' src/lib/adapter/postgres/storage-adapter.ts`

**Gate:** integration test against S3 mock (e.g. MinIO in compose, or `@aws-sdk` mock) covers upload/url/delete + rejection; local driver tested via temp dir.

---

### Story 2.7: Sanitization utility (ADR-005)

As a **developer**, I want a single sanitizer applied to all rich-text HTML before it is stored, so stored content can never carry XSS.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: HTML Sanitization
  Scenario: Scripts are stripped
    Given content '<p>hi</p><script>alert(1)</script>'
    When I sanitize it
    Then the output contains '<p>hi</p>' and no '<script>'
  Scenario: Allowed formatting survives
    Then strong, em, a[href], img[src], h2-h4, ul/ol/li, blockquote are preserved
  Scenario: javascript: URLs are removed
    Given an anchor with href 'javascript:alert(1)'
    Then the href is dropped
```

**Tasks:**

- [ ] Install `sanitize-html`; `src/lib/sanitize.ts` with an allowlist matching TipTap output → verify: `grep -q 'sanitizeHtml\|sanitize' src/lib/sanitize.ts`
- [ ] Apply in `createArticle`/`updateArticle` (sanitize on write) and in the translate proxy → verify: `grep -q 'sanitize' src/lib/adapter/postgres/article-adapter.ts`

**Gate:** `pnpm test:unit run src/lib/__tests__/sanitize.test.ts` covers all scenarios.

---

### Story 2.8: Wire adapter into app

As a **developer**, I want the adapter initialized once and exposed via helpers.

- **Status:** [ ] Not started

**Tasks:**

- [ ] `src/lib/adapter/index.ts` factory + singleton (selects Postgres impl; tests inject the mock) → verify: `test -f src/lib/adapter/index.ts`
- [ ] `src/lib/articles.ts`, `src/lib/settings.ts`, `src/lib/auth.ts` (placeholders wired to adapter) → verify: `grep -q 'getPublishedArticles' src/lib/articles.ts`

**Gate:** `pnpm test:unit run src/lib/adapter/__tests__/index.test.ts` proves singleton + injectable mock.

---

## Epic 3: Authentication (hardened)

Priority: **P1** | Value: High | Effort: M | WSJF: **4.5** | Parallel lane: A (after Epic 2)

### Story 3.1: Password auth + sessions in Postgres

As an **admin**, I want secure password login backed by Postgres. **No public registration** (ADR-003) — the first admin is seeded; further admins are created by an existing admin.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Authentication
  Scenario: Seeded admin exists
    Given the seed/CLI created an admin
    Then a user row exists with an argon2/bcrypt hash (never plaintext)
  Scenario: Login with correct credentials
    Then a server-side session row is created and a token returned
  Scenario: Login with wrong password
    Then it is rejected with 401 and timing is constant-ish (no user-enumeration)
  Scenario: Session validation
    Given a valid, non-expired session token
    Then I get the user; expired/destroyed tokens are rejected
  Scenario: No registration endpoint
    Then there is no public route that creates a user from anonymous input
```

**Tasks:**

- [ ] `src/lib/adapter/postgres/auth-adapter.ts` with `argon2` (or bcrypt) hashing → verify: `grep -q 'authenticateUser' src/lib/adapter/postgres/auth-adapter.ts`
- [ ] User create (admin-guarded, not anonymous) + `createSession`/`validateSession`/`destroySession` with **`expires_at`** → verify: `grep -q 'validateSession' src/lib/adapter/postgres/auth-adapter.ts && grep -q 'expires' src/lib/adapter/postgres/auth-adapter.ts`

**Gate:** `pnpm test:integration run .../auth-adapter.test.ts` covers hashing, login success/failure, session expiry, and asserts no anonymous user-creation path.

---

### Story 3.2: Session cookies, middleware, route protection

As an **admin**, I want my session in a hardened cookie and `/admin/*` protected.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Session Middleware
  Scenario: Login sets a hardened cookie
    Then the Set-Cookie has HttpOnly, Secure, SameSite=Lax, and an expiry
  Scenario: Authenticated user reaches /admin
  Scenario: Unauthenticated /admin redirects to /admin/login
  Scenario: Unauthenticated /api/admin/* returns 401
  Scenario: Logout clears the cookie and destroys the server session
```

**Tasks:**

- [ ] `src/middleware/index.ts` (Astro auto-loads it — **no astro.config entry needed**) using the Postgres adapter; protects `/admin/*` (redirect) and `/api/admin/*` (401) → verify: `grep -q 'admin/login' src/middleware/index.ts && grep -q '401' src/middleware/index.ts`
- [ ] Cookie helpers in `src/lib/auth.ts` with `HttpOnly; Secure; SameSite=Lax` + expiry → verify: `grep -q 'HttpOnly' src/lib/auth.ts && grep -q 'SameSite' src/lib/auth.ts`

**Gate:** `pnpm test:unit run src/lib/__tests__/auth.test.ts` (cookie flags) + an E2E asserting redirect + 401 behavior.

---

### Story 3.3: Auth API endpoints + CSRF + rate limiting

As an **admin**, I want login/logout endpoints that resist brute force and CSRF.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Auth API
  Scenario: POST /api/auth/login succeeds
    Then returns { success: true } and sets the session cookie
  Scenario: POST /api/auth/logout succeeds
  Scenario: Brute force is throttled
    Given >N failed logins from one IP/account in the window
    Then further attempts get 429
  Scenario: CSRF protection on state-changing routes
    Given a cross-origin POST without a valid origin/CSRF token
    Then it is rejected
```

**Tasks:**

- [ ] `src/pages/api/auth/login.ts`, `logout.ts` → verify: `test -f src/pages/api/auth/login.ts && test -f src/pages/api/auth/logout.ts`
- [ ] In-memory/DB-backed login rate limiter → verify: `grep -rq '429' src/`
- [ ] CSRF defense (Origin/Referer check + SameSite=Lax already set) helper applied to admin/auth POSTs → verify: `grep -rq 'csrf\|Origin' src/`

**Gate:** `pnpm test:integration run src/pages/api/__tests__/auth.test.ts` covers login/logout, 429 after threshold, and CSRF rejection.

---

## Epic 4: Public Pages

Priority: **P1** | Value: High | Effort: L | WSJF: **3.0** | Parallel lane: B (after Epic 2; parallel with Epic 5)

> All public pages are created **directly under `src/pages/[...locale]/`** (routing already configured in Epic 1). No restructuring later.

### Story 4.1: Homepage (featured + recent)

```gherkin
Feature: Homepage
  Scenario: Shows featured articles in hero (3 featured exist)
  Scenario: Shows the 6 most recent (10 published exist)
  Scenario: Empty state when no published articles
```

**Tasks:**

- [ ] Port `src/components/ArticleCard.astro` (default/featured/compact), `Navigation.astro`, `Footer.astro` → verify: `test -f src/components/ArticleCard.astro && test -f src/components/Navigation.astro`
- [ ] `src/pages/[...locale]/index.astro` (hero + recent grid via adapter) → verify: `grep -q 'getFeaturedArticles' "src/pages/[...locale]/index.astro"`

**Gate:** `pnpm exec playwright test --grep "homepage"` (featured, recent, empty state).

---

### Story 4.2: Article listing + pagination

```gherkin
Feature: Article Listing
  Scenario: Lists published sorted by publishedAt DESC
  Scenario: /articles?page=2 shows items 13-24 of 25
```

**Tasks:**

- [ ] `src/pages/[...locale]/articles/index.astro` with query-param pagination → verify: `test -f "src/pages/[...locale]/articles/index.astro"`

**Gate:** `pnpm exec playwright test --grep "article listing"`.

---

### Story 4.3: Article detail (sanitized render)

```gherkin
Feature: Article Detail
  Scenario: /en/articles/<slug> shows title, excerpt, sanitized HTML content, image, author, date
  Scenario: 404 for draft articles
  Scenario: 404 for non-existent slug
  Scenario: Rendered HTML contains no <script> even if stored content tried to
```

**Tasks:**

- [ ] `src/pages/[...locale]/articles/[slug].astro`; render with `set:html` on **already-sanitized** content → verify: `grep -q 'set:html' "src/pages/[...locale]/articles/[slug].astro"`
- [ ] 404 handling for missing/draft → verify: `grep -q '404\|notFound' "src/pages/[...locale]/articles/[slug].astro"`

**Gate:** `pnpm exec playwright test --grep "article detail"` incl. an XSS-payload article that renders inert.

---

### Story 4.4: Category pages

```gherkin
Feature: Category Pages
  Scenario: /categories/noticias shows only that category's articles
  Scenario: Empty category shows empty state
```

**Tasks:**

- [ ] `src/pages/[...locale]/categories/[category].astro` (categories from `src/lib/categories.ts` constant) → verify: `test -f "src/pages/[...locale]/categories/[category].astro"`

**Gate:** `pnpm exec playwright test --grep "category"`.

---

### Story 4.5: Search

```gherkin
Feature: Search
  Scenario: Search "Climate" returns the matching article
  Scenario: No-results shows empty message
```

**Tasks:**

- [ ] `src/pages/[...locale]/search.astro` wired to `searchArticles` → verify: `grep -q 'searchArticles' "src/pages/[...locale]/search.astro"`

**Gate:** `pnpm exec playwright test --grep "search"`.

---

### Story 4.6: Static pages

```gherkin
Feature: Static Pages
  Scenario: /about, /contact, /privacy each load with content
```

**Tasks:**

- [ ] `src/pages/[...locale]/{about,contact,privacy}.astro` → verify: `test -f "src/pages/[...locale]/about.astro"`

**Gate:** `pnpm exec playwright test --grep "static pages"`.

---

### Story 4.7: Feeds, sitemap, robots, error pages (NEW — closes omission)

As a **visitor / search engine**, I want an RSS/Atom feed, sitemap, robots.txt, and proper error pages.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Discoverability & Errors
  Scenario: RSS feed validates
    When I GET /rss.xml
    Then it returns valid RSS/Atom of the latest published articles
  Scenario: Sitemap lists public URLs
    When I GET /sitemap.xml
    Then it lists localized article and page URLs
  Scenario: robots.txt references the sitemap
  Scenario: 404 page renders for unknown routes
  Scenario: 500 page renders on a thrown server error (no stack leak)
```

**Tasks:**

- [ ] `src/pages/rss.xml.ts` (via `@astrojs/rss`) → verify: `test -f src/pages/rss.xml.ts`
- [ ] `@astrojs/sitemap` (or custom `sitemap.xml.ts`) + `public/robots.txt` → verify: `test -f public/robots.txt`
- [ ] `src/pages/404.astro` and `src/pages/500.astro` (no stack traces) → verify: `test -f src/pages/404.astro && test -f src/pages/500.astro`

**Gate:** `pnpm exec playwright test --grep "feeds|errors"` (feed validates, 404/500 render).

---

## Epic 5: Admin Panel

Priority: **P1** | Value: High | Effort: L | WSJF: **3.0** | Parallel lane: B (after Epic 3; parallel with Epic 4)

### Story 5.1: Admin login UI

```gherkin
Feature: Admin Login
  Scenario: Valid login redirects to /admin
  Scenario: Invalid credentials show an error
  Scenario: Already-logged-in visiting /admin/login redirects to /admin
```

**Tasks:**

- [ ] `src/pages/admin/login.astro`; port `LoginForm.tsx` → verify: `test -f src/pages/admin/login.astro && grep -rq 'LoginForm' src/components/admin/`
- [ ] Wire to `/api/auth/login` → verify: `grep -q 'api/auth/login' src/components/admin/LoginForm.tsx`

**Gate:** `pnpm exec playwright test --grep "admin login"`.

---

### Story 5.2: Dashboard

```gherkin
Feature: Dashboard
  Scenario: Stats show total 12, published 10, drafts 2
  Scenario: Shows 5 most recent with status
```

**Tasks:**

- [ ] `src/pages/admin/index.astro`; `src/pages/api/admin/dashboard.ts` (Postgres); port `Dashboard.tsx` → verify: `test -f src/pages/api/admin/dashboard.ts && grep -rq 'Dashboard' src/components/admin/`

**Gate:** `pnpm test:integration run src/pages/api/__tests__/dashboard.test.ts` + dashboard E2E.

---

### Story 5.3: Article list management (+ 401 guard lives here)

```gherkin
Feature: Article List
  Scenario: Shows title, status, language badges, published date
  Scenario: Delete removes the article
  Scenario: Empty state with "Create Article"
  Scenario: All /api/admin/articles* reject unauthenticated requests with 401
```

**Tasks:**

- [ ] `src/pages/admin/articles/index.astro` → verify: `test -f src/pages/admin/articles/index.astro`
- [ ] `src/pages/api/admin/articles/index.ts` (GET/POST) and `[id].ts` (GET/PUT/DELETE), each asserting session via middleware/guard → verify: `test -f "src/pages/api/admin/articles/[id].ts"`
- [ ] Verify the 401 guard now that the directory exists (moved here from the old Epic-3 forward-reference) → verify: `grep -rq '401' src/pages/api/admin/`
- [ ] Port `ArticleList.tsx` → verify: `grep -rq 'ArticleList' src/components/admin/`

**Gate:** `pnpm test:integration run src/pages/api/__tests__/articles.test.ts` (CRUD + 401) + list E2E.

---

### Story 5.4: Article editor (TipTap, translations, optional DeepL)

```gherkin
Feature: Article Editor
  Scenario: Create new article gets a unique slug, redirects to edit
  Scenario: Edit persists changes
  Scenario: Bold wraps selection in <strong>
  Scenario: Translation tabs switch locale content
  Scenario: default-locale (English) title required -> "Title (English) is required"
  Scenario: DeepL translate populates target locale WHEN DEEPL_API_KEY is set
  Scenario: Translate control is hidden/disabled WHEN DEEPL_API_KEY is unset
  Scenario: Saved content is sanitized (no <script> persisted)
```

**Tasks:**

- [ ] `src/pages/admin/articles/new.astro`, `[id]/edit.astro` → verify: `test -f src/pages/admin/articles/new.astro && test -f "src/pages/admin/articles/[id]/edit.astro"`
- [ ] Install TipTap 3 set (mirror source versions) → verify: `grep -q '@tiptap/react' package.json`
- [ ] Port `ArticleEditor.tsx`, `ArticleEditorFields.tsx`, `ArticleEditorSidebar.tsx`, and libs `article-editor-slug.ts`, `article-editor-validation.ts`, `article-editor-translate.ts`, `article-editor-types.ts` — **adapt to English-canonical**: required-base-title validation targets the default (English) locale (`getPortugueseTitleValidationError` → `getDefaultLocaleTitleValidationError`, ADR-0020) → verify: `grep -rq 'ArticleEditor' src/components/admin/ && grep -q 'deriveArticleSlug' src/lib/article-editor-slug.ts`
- [ ] `src/pages/api/admin/translate.ts` (DeepL proxy, **feature-flagged on `DEEPL_API_KEY`**, ADR-008; sanitizes output) → verify: `grep -q 'DEEPL_API_KEY' src/pages/api/admin/translate.ts`

**Gate:** `pnpm exec playwright test --grep "create article|editor"` (with DeepL mocked, both flag states) + `pnpm test:integration` for translate proxy on/off.

---

### Story 5.5: Image upload (S3)

```gherkin
Feature: Image Upload
  Scenario: Selecting an image uploads it and sets featured image URL
  Scenario: POST /api/upload without session returns 401
  Scenario: Non-image upload is rejected
```

**Tasks:**

- [ ] `src/pages/api/upload.ts` → storage adapter (S3 default) with auth guard → verify: `test -f src/pages/api/upload.ts && grep -q '401' src/pages/api/upload.ts`
- [ ] Wire preview in `ArticleEditorSidebar` → verify: `grep -q 'upload' src/components/admin/ArticleEditorSidebar.tsx`

**Gate:** `pnpm test:integration run src/pages/api/__tests__/upload.test.ts` (success, 401, rejection).

---

### Story 5.6: Site settings + account management (parity)

```gherkin
Feature: Settings & Account
  Scenario: View current settings (siteName "My News" shows in form)
  Scenario: Update settings persists
  Scenario: Admin can change own email and password (ported from source)
```

**Tasks:**

- [ ] `src/pages/admin/settings.astro`; `src/pages/api/admin/settings.ts` (GET/PUT); port `Settings.tsx` → verify: `test -f src/pages/api/admin/settings.ts`
- [ ] Port `api/admin/account/email.ts` + `account/password.ts` (parity items found in source) → verify: `test -f src/pages/api/admin/account/password.ts`

**Gate:** `pnpm test:integration run src/pages/api/__tests__/settings.test.ts` + account-change tests.

> Note: source `api/admin/redeploy.ts` is Appwrite-specific and **intentionally dropped** (no equivalent trigger); documented in CONVENTIONS.md.

---

## Epic 6: i18n Polish (routing already done in Epic 1)

Priority: **P2** | Value: Med | Effort: S | WSJF: **2.5** | Parallel lane: B (with Epics 4-5)

### Story 6.1: Language switcher

```gherkin
Feature: Language Switcher
  Scenario: Dropdown lists the v1 locales (en, pt-br) labeled
  Scenario: Switching on an article goes to the same page in the new locale
  Scenario: Invalid locale (/fr/...) redirects to default
```

**Tasks:**

- [ ] Port `LanguageSwitcher.tsx`; wire locale into Navigation links → verify: `grep -rq 'LanguageSwitcher' src/components/ && grep -q 'locale' src/components/Navigation.astro`
- [ ] Invalid-locale guard in middleware/`[...locale]` page → verify: `grep -rq 'locale' src/middleware/index.ts`

**Gate:** `pnpm exec playwright test --grep "language switcher|invalid locale"`.

---

### Story 6.2: Localized UI strings

```gherkin
Feature: Localized UI
  Scenario: In English, nav shows Home/Articles/About not Início/Artigos/Sobre
```

**Tasks:**

- [ ] UI translation keys (nav, footer, empty states, buttons); apply in templates → verify: `grep -rq 'uiTranslations\|t(' src/lib/`

**Gate:** `pnpm exec playwright test --grep "localized ui"`.

---

## Epic 7: Open Source Polish & Observability

Priority: **P1** | Value: High | Effort: M | WSJF: **3.5** | Parallel lane: C (after Epic 1; LICENSE/CONTRIBUTING already done in 1.4)

### Story 7.1: README (install + deploy matrix)

```gherkin
Feature: README
  Scenario: Lists prerequisites (Node 22+, PostgreSQL, pnpm, S3-compatible storage)
  Scenario: Has sections for BigBase, Neon, Supabase, stand-alone PostgreSQL
  Scenario: Has sections for Node/VPS, Docker, Netlify, Vercel, Render, Railway
  Scenario: Documents the storage caveat (local FS not durable on serverless)
```

**Tasks:**

- [ ] `README.md` with quickstart, env-var table (incl. `S3_*`, optional `DEEPL_API_KEY`), per-provider + per-host guides, architecture (Mermaid) → verify: `grep -q 'DATABASE_URL' README.md && grep -q 'S3_' README.md`

**Gate:** doc review against scope success criteria #5/#6; links resolve.

---

### Story 7.2: Health & readiness endpoints

As an **operator**, I want liveness/readiness probes. (Structured logging is already foundational — Story 1.6.)

```gherkin
Feature: Health Probes
  Scenario: Liveness is dependency-free
    When I GET /api/health/live
    Then it returns 200 without touching the DB
  Scenario: Readiness checks the DB
    When I GET /api/health
    Then it returns { status: "ok", db: "up" } only when the DB is reachable
  Scenario: Health leaks nothing
    Then the response contains no version, connection string, or stack info
```

**Tasks:**

- [ ] `src/pages/api/health.ts` (readiness — DB ping) and `src/pages/api/health/live.ts` (liveness — no deps) → verify: `test -f src/pages/api/health.ts`
- [ ] Confirm migration/startup paths log success/failure via `src/lib/logger.ts` (from Story 1.6) → verify: `grep -q 'logger' src/lib/adapter/postgres/migrate.ts`

**Gate:** `pnpm test:integration run .../health.test.ts` (ok + db-down + liveness-no-DB + no-leak).

---

### Story 7.3: Docker support

```gherkin
Feature: Docker
  Scenario: docker build succeeds (Node 22 + pnpm + astro build, multi-stage)
  Scenario: Container starts on 4321 with DATABASE_URL set
```

**Tasks:**

- [ ] Multi-stage `Dockerfile` (Node 22, pnpm, runs migrations on start) + `.dockerignore` → verify: `test -f Dockerfile && test -f .dockerignore`

**Gate:** CI builds the image and boots it against the service Postgres; `/api/health` returns ok.

---

### Story 7.4: Deploy configs

```gherkin
Feature: Deploy Configs
  Scenario: netlify.toml has build/publish settings
  Scenario: vercel.json has build/routing settings
```

**Tasks:**

- [ ] `netlify.toml`, `vercel.json` (document that these need S3 storage, not local FS) → verify: `test -f netlify.toml && test -f vercel.json`

**Gate:** `astro build` succeeds with each adapter selected (matrix build in CI).

---

### Story 7.5: Security Hardening (cross-cutting)

As a **maintainer**, I want the application hardened against the common web attack surface so a self-hosted big-news is safe by default. Individual items land in their home modules (middleware, upload, auth, CI), but they are tracked and **gated here as a release blocker before Epic 8**.

- **Status:** [ ] Not started

**Acceptance Criteria:**

```gherkin
Feature: Security Headers (ADR-009)
  Scenario: Every response carries security headers
    When I request any page
    Then the response has a Content-Security-Policy, X-Content-Type-Options: nosniff,
      Referrer-Policy, Strict-Transport-Security, and frame-ancestors 'none'
  Scenario: Inline script injected into content does not execute under CSP
    Given an article whose content tried to embed an inline event handler
    Then the browser blocks execution (CSP) even if sanitization were bypassed

Feature: Upload Hardening (ADR-010)
  Scenario: Content is validated by magic bytes, not the declared MIME
    Given a file named photo.png whose bytes are HTML
    Then the upload is rejected
  Scenario: Raster images are re-encoded
    Given a JPEG with embedded EXIF/script payload
    Then the stored image is re-encoded and the payload is gone
  Scenario: SVG uploads are blocked
    When I upload an .svg
    Then it is rejected
  Scenario: Filenames cannot traverse
    Given a filename '../../etc/passwd'
    Then the stored key is sanitized to a safe name
  Scenario: Oversized uploads are rejected before full buffering
    Given a file exceeding the configured max
    Then the request is rejected with 413 without loading it all into memory
  Scenario: User files cannot execute in the app origin
    When a stored file is served
    Then it is delivered from a separate origin or with Content-Disposition: attachment and a fixed Content-Type

Feature: Input Validation (ADR-015 — "found missing input validation")
  Scenario: Every API route validates its input against a schema
    Given any /api/* route
    When it receives a body/query/params
    Then the input is parsed by a zod schema and rejected with 400 if invalid
  Scenario: A route-coverage test asserts no unvalidated handler
    Then a sweep test fails if any API handler reads req input without a schema

Feature: Query Safety (ADR-011)
  Scenario: All queries are parameterized
    Then no adapter query builds SQL by string-concatenating user input
    And dynamic ORDER BY / pagination map through an allowlist
  Scenario: Injection attempt is inert
    Given a search term "x'; DROP TABLE articles;--"
    Then it returns normally and no table is dropped

Feature: Session Integrity (ADR-012)
  Scenario: Session id rotates on login
    Given an anonymous session id
    When I log in
    Then the session id changes
  Scenario: Password change invalidates other sessions
    Given I am logged in on two devices
    When I change my password
    Then the other device's session is invalidated
  Scenario: Idle and absolute timeouts apply

Feature: Shared Rate Limiting (ADR-013)
  Scenario: Throttle holds across instances
    Given two app instances behind a load balancer
    When failed logins exceed the threshold across both
    Then further attempts get 429 regardless of which instance serves them

Feature: CI Scanning & Error Hygiene (ADR-014)
  Scenario: Dependency and secret scans run on every PR
    Then npm audit (or Dependabot) and gitleaks run and block on high-severity findings
  Scenario: API errors are generic
    Given a query that errors
    Then the response contains no DB/schema text or stack trace
```

**Tasks:**

- [ ] **Headers (ADR-009):** add a security-headers layer in `src/middleware/index.ts` — CSP (allowlist; image src includes the upload origin), `nosniff`, `Referrer-Policy`, HSTS, `frame-ancestors 'none'` → verify: `grep -q 'Content-Security-Policy' src/middleware/index.ts`
- [ ] **Upload (ADR-010):** in `src/lib/adapter/postgres/storage-adapter.ts` + `src/pages/api/upload.ts` — magic-byte sniff, re-encode raster (e.g. `sharp`), reject SVG, sanitize filename/key, stream-cap with `413`, serve with `Content-Disposition: attachment` + fixed type → verify: `grep -q 'sharp\|magic\|sniff' src/lib/adapter/postgres/storage-adapter.ts && grep -q '413' src/pages/api/upload.ts`
- [ ] **Input validation (ADR-015):** apply a `zod` schema (via `src/lib/validation.ts` from Story 1.6) to **every** `/api/*` handler — body/query/params parsed, `400` on failure; add a route-coverage sweep test that fails on any unvalidated handler → verify: `grep -rq 'validate\|safeParse' src/pages/api/`
- [ ] **Query safety (ADR-011):** audit all adapter queries to tagged templates; allowlist `ORDER BY`/sort/pagination; add a lint rule or test asserting no raw interpolation → verify: `grep -rq 'unsafe\|sql.unsafe' src/lib/adapter/postgres/ && echo CHECK` (manual: confirm none used with user input)
- [ ] **Sessions (ADR-012):** rotate id in `login.ts`; `destroyAllUserSessions` called from password/email change in `account/*`; idle + absolute expiry in `auth-adapter.ts` → verify: `grep -q 'destroyAllUserSessions\|rotate' src/lib/adapter/postgres/auth-adapter.ts`
- [ ] **Shared rate limit (ADR-013):** move the limiter to a Postgres-backed store (table + window) used by login/translate/upload → verify: `grep -rq 'rate_limit\|rateLimit' src/lib/`
- [ ] **DeepL abuse (ADR-013):** apply the shared limiter + max payload to `api/admin/translate.ts` → verify: `grep -q 'rateLimit\|maxPayload\|413' src/pages/api/admin/translate.ts`
- [ ] **Health hygiene (ADR-014):** ensure `/api/health` exposes only `{status, db}` — no versions/conn strings → verify: `grep -q 'status' src/pages/api/health.ts`
- [ ] **CI scanning (ADR-014):** add `npm audit`/Dependabot config + `gitleaks` job to `ci.yml`; generic API error mapper (`src/lib/errors.ts`) → verify: `grep -q 'gitleaks\|audit' .github/workflows/ci.yml && test -f src/lib/errors.ts`

**Gate:** `pnpm test:integration run src/**/__tests__/security.test.ts` + a Playwright pass covering CSP header presence, upload rejections (bad-magic / SVG / traversal / oversized), session rotation, password-change invalidation, and an injection-inert search; CI shows the scanning jobs green. **This Gate is a hard release blocker for Epic 8.**

---

## Epic 8: Demo Deploy

Priority: **P1** | Value: High | Effort: S | WSJF: **8.0** | Parallel lane: final (integration)

### Story 8.1: BigBase Postgres at news.bigbase.click (least-privilege)

**Acceptance Criteria:**

```gherkin
Feature: BigBase Setup
  Scenario: PostgreSQL endpoint is reachable
  Scenario: Migrations applied -> articles, article_translations, users, settings, sessions exist
  Scenario: Runtime role is least-privilege (ADR-016)
    Given the role in the app's DATABASE_URL
    Then it can SELECT/INSERT/UPDATE/DELETE its tables but cannot run DDL or act as superuser
    And migrations use a separate, more-privileged role
  Scenario: S3 credentials are scoped (ADR-016)
    Then the app's S3 key is limited to the one bucket with only the needed actions
```

**Tasks:**

- [ ] Provision BigBase Postgres; create a **least-privilege runtime role** (DML on app tables only) + a separate migration role; set `DATABASE_URL` + scoped `S3_*` + session secret as deploy env (never committed) → verify: `psql "$DATABASE_URL" -c "\dt" 2>&1 | grep -q articles`
- [ ] Confirm runtime role cannot DDL → verify: `psql "$DATABASE_URL" -c "CREATE TABLE _x(i int)" 2>&1 | grep -qi 'permission denied\|must be owner'`
- [ ] Run migrations with the migration role → verify: migration table shows applied set

**Gate:** remote `\dt` lists all five tables + `pgmigrations`; the DDL-denied probe confirms least privilege.

---

### Story 8.2: Seed demo data + first admin

```gherkin
Feature: Seed Data
  Scenario: Seed creates the first admin (idempotent; ADR-003)
  Scenario: >=5 demo articles with images across multiple categories
  Scenario: Admin can log in with seeded credentials
```

**Tasks:**

- [ ] `scripts/seed.ts` — idempotent: creates first admin (hashed), demo articles + categories, uploads sample images to S3 → verify: `test -f scripts/seed.ts`
- [ ] `pnpm seed` against BigBase → verify: `pnpm seed 2>&1 | grep -qi 'seeded\|done'`

**Gate:** smoke: `curl -s https://news.bigbase.click/articles | grep -qi 'article'` and login E2E against the deployed admin.

---

### Story 8.3: Security-review gate, deploy with health-gate + rollback

```gherkin
Feature: Live Demo
  Scenario: Security review passes before deploy (ADR-017 — "nothing ships without my review")
    Given the release diff
    When /security-review runs
    Then any findings are fixed and re-reviewed, and the gate is green before deploy proceeds
  Scenario: Homepage returns 200 HTML
  Scenario: /api/health returns ok
  Scenario: Seeded article loads
  Scenario: Full admin CRUD flow works end-to-end
  Scenario: Failed post-deploy smoke triggers rollback (previous release stays live)
```

**Tasks:**

- [ ] **Run `/security-review` on the release branch (ADR-017); fix findings, re-review until clean** — hard gate before any deploy step → verify: review report attached to the release PR with no unresolved high/medium findings
- [ ] Deploy to news.bigbase.click (Node adapter), **migrations run on boot under advisory lock** → verify: `curl -s -o /dev/null -w "%{http_code}" https://news.bigbase.click | grep -q 200`
- [ ] Post-deploy smoke gate: hit `/api/health` + homepage; **on failure, roll back** to previous release → verify: `curl -s https://news.bigbase.click/api/health | grep -q '"status":"ok"'`
- [ ] Run full Playwright E2E against deployed site → verify: `pnpm exec playwright test`
- [ ] Tag `v1.0.0` (repo already public since Epic 1) → verify: `git tag | grep -q 'v1.0.0'`

**Gate:** all scenarios pass; a forced-failure drill confirms rollback keeps the prior version serving.

---

## Epic 9: Support (post-launch lifecycle phase)

Priority: **P2** | Value: Med | Effort: S | WSJF: **2.0** | Parallel lane: after Epic 8

> The conference lifecycle is Prototype → Design → Build → Deploy → **Support**. The original plan stopped at Deploy. This epic makes operating big-news after v1.0 a first-class concern — for the demo _and_ for self-hosters.

### Story 9.1: Uptime & alerting

As an **operator**, I want to know when the demo is down before users do.

```gherkin
Feature: Uptime Monitoring
  Scenario: External check pings /api/health on a schedule
    Then a failed check alerts the maintainer (email/webhook)
  Scenario: Alert includes the request id / last error from structured logs
```

**Tasks:**

- [ ] External uptime check (cron/GitHub Action or host monitor) hitting `/api/health` → verify: `test -f .github/workflows/uptime.yml || echo "documented monitor"`
- [ ] Alert wiring (email/webhook) documented in README ops section → verify: `grep -qi 'monitor\|uptime\|alert' README.md`

**Gate:** a forced health failure triggers an alert in a dry run.

### Story 9.2: Incident runbook & support docs

As a **maintainer/self-hoster**, I want a runbook for common failures.

```gherkin
Feature: Runbook
  Scenario: DB down, deploy failed, rollback, restore-from-backup, rotate-secret each have steps
  Scenario: SECURITY.md tells researchers how to report vulnerabilities
```

**Tasks:**

- [ ] `docs/RUNBOOK.md` (DB outage, failed deploy, rollback, secret rotation, restore) → verify: `test -f docs/RUNBOOK.md`
- [ ] `SECURITY.md` with a disclosure policy + contact → verify: `test -f SECURITY.md`
- [ ] Issue/PR templates (`bug_report`, `feature_request`, PR checklist) → verify: `test -d .github/ISSUE_TEMPLATE`

**Gate:** doc review; a maintainer can follow rollback + secret-rotation end to end.

### Story 9.3: Maintenance cadence

As a **maintainer**, I want dependency and security updates to keep flowing post-v1.

```gherkin
Feature: Maintenance
  Scenario: Dependabot opens dependency PRs; CI gates them
  Scenario: Backup/restore for the demo DB is verified, not assumed
```

**Tasks:**

- [ ] Dependabot config (or Renovate) → verify: `test -f .github/dependabot.yml`
- [ ] Documented + tested backup/restore for the demo Postgres → verify: `grep -qi 'backup\|restore' docs/RUNBOOK.md`

**Gate:** a Dependabot PR passes the full CI matrix; a backup is taken and restored into a scratch DB successfully.

---

## Execution Order, Lanes & WSJF

Strictly dependency-constrained; within constraints, higher WSJF runs first. Lanes show what can overlap.

```
Epic 1  Foundation+i18n+CI+repo   ── blocks everything ──┐
                                                         ▼
Epic 2  Data Layer (lane A)  ───────────────┐
                                            ▼
Epic 3  Auth (lane A, after 2) ─────────────┤
                                            ▼
        ┌──────────────── parallel ───────────────┐
Epic 4  Public Pages (lane B, after 2)            │
Epic 5  Admin Panel  (lane B, after 3)            │
Epic 6  i18n Polish  (lane B, after 4)            │
        └──────────────────────────────────────────┘
Epic 7  OSS Polish + Health (lane C, after 1; can run alongside B)
        └─ Story 7.5 Security Hardening (touches 3/5/CI; HARD GATE before 8)
                                            ▼
Epic 8  Demo Deploy (final integration; needs 2-7, blocked by 7.5 gate
        + /security-review gate ADR-017)
                                            ▼
Epic 9  Support (post-launch: uptime, runbook, maintenance)
```

Build phase (Epics 4/5/6) runs as **orchestrator + parallel subagents** (see Delivery Method). WSJF reconciled (was decorative before): **1 = 9.0**, **8 = 8.0**, **2 = 6.0**, **3 = 4.5**, **7 = 3.5**, **4 = 3.0**, **5 = 3.0**, **6 = 2.5**, **9 = 2.0**. Epic 8's high score reflects its high value + small size; it still runs late because it depends on 2–7 (WSJF orders _within_ the dependency DAG, it doesn't override it). Epic 9 follows launch.

---

## Definition of Done (every story)

1. Gherkin scenarios implemented as vitest/Playwright tests — the **Gate** command is green.
2. `pnpm typecheck` and `pnpm lint` clean.
3. No secrets in code; new env vars added to `.env.example` and README.
4. Rich-text paths route through `src/lib/sanitize.ts` (output); **every API input is validated by a `zod` schema** (`src/lib/validation.ts`, ADR-015).
5. Admin routes (pages + `/api/admin/*`) enforce auth.
6. Logging via `src/lib/logger.ts` (no `console.*`); new endpoints emit a request-id log line.
7. CI (all jobs incl. integration + E2E) green on the PR.
8. **`audit-code` gate passed** (bigpowers step 6) — no failing checklist items.
9. **Release-level (Epic 8):** `/security-review` is clean (ADR-017) and runtime credentials are least-privilege (ADR-016).

## Cross-Cutting Requirements (checked in CI, not per-story)

- ESM-only, Node 22+. No `console.log` in shipped code paths (use `src/lib/logger.ts`).
- Every `/api/admin/*` and `/api/upload` returns `401` unauthenticated (asserted by a sweep test).
- Every rich-text render reads sanitized content (asserted by the XSS E2E in 4.3).
- Cookies always `HttpOnly; Secure; SameSite=Lax`; session id rotates on login (ADR-012).
- Every response carries CSP + security headers (ADR-009); all DB access is parameterized (ADR-011); API errors are generic (ADR-014).
- Every `/api/*` handler validates input via a `zod` schema (ADR-015), asserted by a route-coverage sweep test.
- **Story 7.5 (Security Hardening) Gate is a hard release blocker — Epic 8 must not deploy until it is green.**
- **`/security-review` must be clean and runtime credentials least-privilege (ADR-016/017) before Epic 8 deploys.**

---

## Suggested Next Steps

1. Run **`build-epic`** per epic — this chains the full 8-step cycle (survey → plan → kickoff → TDD → verify → audit → commit → release).
2. For each epic, **`build-epic`** handles Steps 1-8 automatically:
   - Step 1–2: `survey-context` + `plan-work` to flesh out tasks
   - Step 3: `kickoff-branch` for the feature branch
   - Step 4: `develop-tdd` per task (red-green-refactor)
   - Step 5: `verify-work` against Gates + DoD
   - Step 6: `audit-code` **(non-optional)** — loop back to step 4 on failure
   - Step 7: `commit-message` for Conventional Commits
   - Step 8: `release-branch` to PR/merge
3. **Build phase (Epics 4–6):** run `build-epic` in parallel subagents (public-site / admin-panel / i18n-polish), each following the same 8-step cycle independently.
4. Before Epic 8, run **`/security-review`** (ADR-017) and fix findings until clean.
5. Run **`deploy`** + **`smoke-test`** for Epic 8 to push to news.bigbase.click.
6. **Support (Epic 9):** stand up `wire-observability` monitoring, the runbook, and Dependabot.
