# ADR-0020: English-canonical project; product i18n en + pt-br for v1

**Status:** Accepted
**Date:** 2026-06-22

## Context

The maintainer converses in English and pt-br, but big-news is a public, MIT, global OSS project.
Upstream astrobiologia is Portuguese-first (default locale pt-br, routes /artigos /busca /sobre,
Portuguese category names and validation strings). "All in English" must be reconciled with the
in-scope multi-language i18n feature — these are two different axes (project language vs product locales).

## Decision

1. **Project language = English (hard rule).** All code, identifiers, comments, file/dir names, route
   paths, logs, default/internal/error strings, commit messages, and documentation are English,
   regardless of conversation language. Translated comments/identifiers are defects.
2. **Product i18n = English-canonical.** `defaultLocale: "en"`; English is the source for all string
   keys, defaults, and seed content.
3. **v1 ships `[en, pt-br]`.** pt-br is added from day one to prove the i18n structure works end to end
   (routing, translation tabs, switcher, fallbacks). es/ja/nl/zh are deferred post-v1 (structure proven,
   trivial to add) — moved to out_of_scope.
4. **Route paths are English:** /articles, /categories, /search, /about, /contact, /privacy; admin
   /admin/articles, /admin/settings. Upstream Portuguese paths are renamed on port.
5. **Parity is functional, not literal** — "feature parity with astrobiologia" means equivalent features,
   not identical Portuguese URLs/strings.

## Consequences

- Ported libs adapt: `getPortugueseTitleValidationError` → `getDefaultLocaleTitleValidationError`
  ("Title (English) is required"); category keys/slugs become English with localized labels.
- The demo's existing Portuguese URLs change; acceptable for a fresh v1 launch.
- Adding es/ja/nl/zh later is config + translation files, no structural work (proven by pt-br).
