# Story e01s01 — Initialize Astro 5+ project with i18n

- **Epic:** e01 — Foundation & Scaffold
- **BCPs:** 1
- **Status:** planned
- **Spine:** scope-work → slice-tasks → **plan-work (this)** → kickoff-branch → develop-tdd
- **Net-new?** Yes — `website/` is a bare `npm create astro` scaffold (astro ^7, empty
  `astro.config.mjs`). No existing dependents → `assess-impact` skipped per build-epic Step 2.

## Goal

Turn the bare Astro scaffold in `website/` into the project's real foundation: SSR with the
`@astrojs/node` standalone adapter, React 19 islands, Tailwind CSS v4, strict TypeScript, and
i18n routing (`defaultLocale: "en"`, locales `[en, pt-br]`, `prefixDefaultLocale: false`), plus
the ported locale helpers.

## Acceptance (from epic.yaml)

- `npm run dev` starts on localhost:4321
- `npm run build` produces an SSR server build in `dist/`
- `npm run typecheck` reports no type errors
- `astro.config.mjs`: `i18n.defaultLocale = "en"`, locales `[en, pt-br]`, `routing.prefixDefaultLocale = false`

## References (discovery)

- **tech-stack.md:** Astro 5+ `output: "server"` + `@astrojs/node` standalone; React 19 islands;
  Tailwind v4 via `@tailwindcss/vite`; public pages under `src/pages/[...locale]/`; ported libs
  `locale.ts`, `article-locales.ts` adapted to English-canonical; category keys English.
- **Upstream source (local):** `/Users/danielvm/astrobiologia/apps/web-astro/src/lib/`
  - `locale.ts` — `normalizeLocaleTag`, `primaryLanguageSubtag`, `localeTagsMatch`. **Locale-agnostic
    → ports verbatim.** Tests exist upstream (`__tests__/locale.test.ts`) — port them too.
  - `article-locales.ts` — `ARTICLE_LOCALES = ["pt-br","en","nl","es","ja","zh"]`,
    `getArticleLocaleLabels(uiLocale)`. See Decision 1.
  - `categories.ts` — **does NOT exist upstream.** Net-new (Decision 2).

## Decisions required before develop-tdd

1. **article-locales scope/order (MULTIPLE INTERPRETATIONS).** Upstream `ARTICLE_LOCALES` lists 6
   locales, Portuguese-first. Site _routing_ i18n is `[en, pt-br]` only (ADR-0020; es/ja/nl/zh
   deferred post-v1). `ARTICLE_LOCALES` is the **article-translation data model**, distinct from
   routing locales. **Recommended:** port all 6 (data model unchanged) but reorder English-first
   `["en","pt-br","es","nl","ja","zh"]` for English-canonical consistency; keep `getArticleLocaleLabels`.
   _Alternative:_ trim to `["en","pt-br"]` now and re-expand later. Pick one.
2. **categories.ts is net-new, not a port.** Task wording says "port" but there is no upstream file.
   Create `website/src/lib/categories.ts` with English keys/slugs: `news`, `interviews`, `analysis`,
   `brazilian-research` (+ any others the data layer e02 will need). Human-facing labels localized
   later. **Confirm the v1 category key set** — anything beyond these four is a guess.

## Slopcheck (external packages)

All first-party, official integrations → `[OK]`, no human approval needed:

| Package                                        | Tag    | Note                              |
| ---------------------------------------------- | ------ | --------------------------------- |
| `@astrojs/node`                                | `[OK]` | official SSR adapter (standalone) |
| `@astrojs/react` + `react@19` + `react-dom@19` | `[OK]` | official React 19 islands         |
| `@tailwindcss/vite` + `tailwindcss@4`          | `[OK]` | official Tailwind v4 Vite plugin  |

## Out of scope (later e01 stories)

- `logger.ts` / `validation.ts` / zod / middleware → **e01s06**
- test infra (docker-compose Postgres, mock adapter, vitest projects) → **e01s05**
- `Footer.astro` + design tokens → **e01s07**
- the `[...locale]/` page tree content → e04 (only the i18n _config_ lands here)

## Note on verify commands

`npm` is the `_bsm_wrap` shell function in this environment — it fails when called bare. Tasks use
the absolute binary `/Users/danielvm/.nvm/versions/node/v24.15.0/bin/npm` and `cd website` since all
npm scripts run from `website/`. See `specs/epics/e01-foundation-scaffold/e01s01-tasks.yaml`.
