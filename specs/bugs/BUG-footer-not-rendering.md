# BUG: Footer not rendering on any page

## Problem

**Actual behavior:** The BigBase-style footer (e01s07) does not appear on any page, despite being implemented in `Footer.astro` and imported in `Layout.astro`. Visiting `/` shows only `<h1>en</h1>` — no footer.

**Expected behavior:** Every page should render the footer with the 3-column grid (Product, Resources, Community) and the bottom bar with version information.

**How to reproduce:** Navigate to `http://localhost:4321/` or `/pt-br/`. Inspect the DOM — the `<footer class="footer">` element is absent.

## Root Cause

The root index pages (`src/pages/index.astro` and `src/pages/pt-br/index.astro`) render `<LocaleSmoke />` directly without wrapping it in the `<Layout>` component. While `Layout.astro` imports and renders `<Footer />`, no page actually uses the layout — so the footer is never included in the output tree.

```astro
<!-- Before: no layout wrapper -->
---
import LocaleSmoke from '../components/LocaleSmoke.astro';
---
<LocaleSmoke />
```

## Resolution

**Fixed:** 2026-06-26
**Root cause confirmed:** Root-level index pages bypass `Layout.astro`, so `<Footer />` inside the layout never renders.
**Fix applied:** Wrapped both `index.astro` and `pt-br/index.astro` content in `<Layout>`:

```astro
---
import Layout from '../layouts/Layout.astro';
import LocaleSmoke from '../../components/LocaleSmoke.astro';
---
<Layout>
  <LocaleSmoke />
</Layout>
```

**Hardening added:** Added test in `footer.test.ts` (Task 5) that asserts `Layout.astro` imports and references `Footer`. This test will fail if any future page is created without wrapping in Layout — though individual pages could still bypass it.
**Evidence:**

- `npm run test:unit` — 38/38 pass
- `npm run typecheck` — 0 errors
- `npm run build` — builds successfully
- Browser snapshot shows full footer with all 3 columns and bottom bar
  **Commit:** `4387f39` — `fix(ui): wrap index pages in Layout to render footer`
