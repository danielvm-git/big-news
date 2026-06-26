# Story e02s01 — Storage adapter interface (the test seam)

- **Epic:** e02 — PostgreSQL Data Layer
- **BCPs:** 1
- **Status:** planned
- **Spine:** scope-work → slice-tasks → **plan-work (this)** → kickoff-branch → develop-tdd
- **Net-new?** Mostly. Expands the e01 stub `src/lib/adapter/index.ts` (`interface StorageAdapter {}`)
  and the empty `MockAdapter` (`src/lib/adapter/__tests__/mock-adapter.ts`). No production callers
  yet — only the mock and the e02 Postgres adapters (built later) implement it.

## Goal

Define the thin TypeScript contract for the storage seam (ADR-0004): sub-adapter interfaces for
**Article**, **Auth**, **Storage (files)**, and **Settings**, the domain data types they exchange, and
the composed `StorageAdapter`. This is the first e02 story because every later story (postgres
connection, migrations, article/settings/S3 adapters) and downstream epic (e03 auth, e04 public,
e05 admin) implements or consumes this interface. The in-memory `MockAdapter` is made to satisfy it
so unit tests run with no database (the e01 unit/integration split already exists in
`vitest.config.ts`).

## Zoom-out (existing module being expanded)

- **Purpose:** `src/lib/adapter/` is the storage-adapter seam — the single boundary between app code
  and any backend (Postgres + S3), so the rest of the app never imports `postgres` or `@aws-sdk` directly.
- **Callers:** today only `__tests__/mock-adapter.ts` (`implements StorageAdapter`). After e02 the
  Postgres adapters implement it; after e03–e05 routes/pages consume it via a composition root.
- **Contracts to preserve:** `StorageAdapter` must remain importable from `'../index.js'` (the path
  the existing mock imports). Keep that re-export so the mock and future consumers don't break.

## Acceptance (from epic.yaml)

The interface defines, at minimum:

- **Article:** createArticle, getArticle, updateArticle, deleteArticle, listArticles, getArticleBySlug,
  getPublishedArticles, getFeaturedArticles, getArticlesByCategory, searchArticles
- **Translation:** createTranslation, getTranslations, updateTranslation, deleteTranslation
- **Auth:** createUser, authenticateUser, createSession, validateSession, destroySession, getUser
- **Storage:** uploadFile, getFileUrl, deleteFile
- **Settings:** getSettings, updateSettings
- `MockAdapter` type-checks against `StorageAdapter`; the contract unit test passes.

## References (discovery)

- **tech-stack.md:** thin storage-adapter seam at `src/lib/adapter/` (DB + Auth + Storage), mockable
  test seam (ADR-0004); domain types carry **no Appwrite `$id`/`$createdAt`** — plain `id`/`createdAt`.
- **Upstream source:** `apps/web-astro/src/lib/appwrite.ts` + `article-read.ts` are what this replaces;
  the method surface above mirrors their responsibilities (article CRUD/queries, translations, auth,
  storage, settings) minus Appwrite specifics.
- **Existing e01 artifacts:** `src/lib/adapter/index.ts` (stub), `__tests__/mock-adapter.ts` (empty
  class), `vitest.config.ts` (unit excludes `*.integration.test.ts`).

## Decisions (resolved — flag if you disagree in develop-tdd)

1. **File layout.** Put sub-adapter interfaces + domain types + composed `StorageAdapter` in a new
   `src/lib/adapter/types.ts`; have `index.ts` `export * from './types.js'` so `StorageAdapter` stays
   importable from `'../index.js'` (preserves the mock's existing import). _Alternative:_ inline
   everything into `index.ts`. **Recommended:** `types.ts` + re-export.
2. **Domain types are net-new, English-canonical.** `ArticleData`, `TranslationData`, `UserData`,
   `SettingsData`, `SessionData` — defined here, not ported field-for-field; they are the shape the
   Postgres rows map onto (see e02s03 schema).

## Slopcheck (external packages)

None — this story adds **zero** dependencies (pure TypeScript interfaces + a mock). `[OK]`.

## Out of scope (later e02 stories)

- postgres.js connection module → **e02s02**
- migrations / schema → **e02s03**
- Postgres implementations of these interfaces → **e02s04** (article), **e02s05** (settings), **e02s06** (storage)
- password hashing / real session validation → **e03** (auth only stubs its interface shape here)
- sanitizer → **e02s07** (separate util, not part of the adapter surface)

## Note on verify commands

`npm` is the `_bsm_wrap` shell function in this environment — it fails when called bare. Tasks use the
absolute binary `/Users/danielvm/.nvm/versions/node/v24.15.0/bin/npm` and `cd website` since all npm
scripts run from `website/`. Runnable steps live in `e02s01-tasks.yaml`.
