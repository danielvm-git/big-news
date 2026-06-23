# Refactor: Move website code into `website/` subdirectory

> **Status:** Adopted layout. The site now lives in `website/` as a pure-**npm** app
> (`package-lock.json`), versioned manually starting at `0.1.0` — there is no
> semantic-release and no `.releaserc`/`pnpm-*` files. The `git mv` steps below are
> historical (they assumed a root-level pnpm project); treat this doc as the rationale
> for the `website/` layout, with npm commands.

## Problem Statement

The project root at `/Users/danielvm/Developer/big-news/` is cluttered with all website code, configs, and project-level artifacts mixed together: the Astro application source, test configs, CI workflows, specs, git hooks, editor settings — everything at the top level. This makes it hard to distinguish what belongs to the website application vs. what belongs to the project/repo itself.

The goal is to move all website-specific code into a `website/` subdirectory, leaving only project-level meta-artifacts at the root. This gives a clean, standard layout where `website/` is a self-contained application directory and the root is the repository wrapper.

## Solution

**New root structure:**

```
/Users/danielvm/Developer/big-news/
├── .git/
├── .github/              # CI workflows (stays at root — GitHub platform)
├── specs/                # Project specs, ADRs (stays at root — project-level)
├── .husky/               # Git hooks (stays at root — git workflow)
├── CLAUDE.md             # Agent instructions (root — workspace-level)
├── CONVENTIONS.md        # Agent conventions (root — workspace-level)
├── CONTRIBUTING.md       # Contribution guide (root — project-level)
├── LICENSE               # MIT license (root — project-level)
├── README.md             # Project README (root — project-level)
├── .gitignore            # Root ignores website/ build artifacts
├── commitlint.config.js  # Commit message linting (root — git workflow)
├── lint-staged.config.js # Lint-staged patterns prefixed with website/
├── package.json          # MINIMAL — only dev tooling deps (husky, lint-staged, prettier, commitlint)
│
└── website/              # Self-contained Astro application
    ├── package.json
    ├── package-lock.json
    ├── astro.config.mjs
    ├── tsconfig.json
    ├── vitest.config.ts
    ├── playwright.config.ts
    ├── .prettierrc
    ├── .prettierignore
    ├── .npmrc
    ├── .env.example
    ├── docker-compose.test.yml
    ├── src/
    ├── public/
    ├── e2e/
    └── dist/
```

## Commits

### Commit 1: Move application source + configs into `website/`

Move all website-specific files and directories — the source code, config files, test files, and build artifacts — into the `website/` subdirectory. Uses `git mv` so history is preserved.

```
git mv src/ website/src/
git mv public/ website/public/
git mv e2e/ website/e2e/
git mv astro.config.mjs website/
git mv tsconfig.json website/
git mv vitest.config.ts website/
git mv playwright.config.ts website/
git mv package.json website/        (the full website package)
git mv package-lock.json website/
git mv .prettierrc website/
git mv .prettierignore website/
git mv .npmrc website/
git mv .env.example website/
git mv docker-compose.test.yml website/
git mv .vscode/ website/
```

→ verify: `test -d website/src && test -f website/package.json && test -f website/astro.config.mjs`

### Commit 2: Create root `.gitignore` for website artifacts

Update the root `.gitignore` to ensure the website's build outputs and dependencies are not tracked at the repo level. The root `.gitignore` stays minimal — just common patterns.

Add to root `.gitignore`:

- `website/dist/`
- `website/node_modules/`
- `website/.astro/`
- `website/uploads/`

If `dist/`, `node_modules/`, `.astro/` already exist in the root `.gitignore`, they will still match `website/dist/`, etc. (git patterns match at any level). So this commit only adds patterns that don't already exist.

→ verify: No build artifacts appear in `git status`

### Commit 3: Create minimal root `package.json` for dev tooling

Root needs a tiny `package.json` so that the git hooks (Husky, lint-staged) can resolve their binaries. This package.json contains ONLY dev tooling dependencies — no application code.

```json
{
  "name": "big-news-root",
  "private": true,
  "type": "module",
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^17.0.8",
    "prettier": "^3.8.4",
    "prettier-plugin-astro": "^0.14.1",
    "@commitlint/cli": "^21.0.2",
    "@commitlint/config-conventional": "^21.0.2"
  }
}
```

The `prepare` script runs `husky` on install, which sets `core.hooksPath .husky`. This stays at root because hooks are a repo-level concern.

→ verify: `test -f package.json && grep -q '"husky"' package.json && grep -q '"lint-staged"' package.json`

### Commit 4: Restore CLAUDE.md + CONVENTIONS.md + CONTRIBUTING.md at root

These files were moved in Commit 1 (they were at root and got `git mv`'d). Move them back to root:

```
git mv website/CLAUDE.md .
git mv website/CONVENTIONS.md .
git mv website/CONTRIBUTING.md .
```

Update `CLAUDE.md` to reflect the new directory structure:

- Update all `npm` commands to reference the `website/` directory: `cd website && npm run dev`
- Add a note about the directory layout

→ verify: `test -f CLAUDE.md && test -f CONVENTIONS.md && test -f CONTRIBUTING.md`

### Commit 5: Update `lint-staged.config.js` patterns for `website/` prefix

The root `lint-staged.config.js` needs its glob patterns updated to match files inside `website/`, because git now tracks them as `website/src/...` etc.

```js
export default {
  "website/**/*.{js,ts,mjs,mts,cjs,cts,jsx,tsx,astro}": ["prettier --write"],
  "website/**/*.{json,md,yaml,yml}": ["prettier --write"],
};
```

→ verify: `grep -q 'website' lint-staged.config.js`

### Commit 6: Update CI workflow with `working-directory: ./website`

The CI workflow in `.github/workflows/ci.yml` runs `npm` commands. After the move, these need to execute inside `website/`.

Add `defaults` at the job or workflow level:

```yaml
defaults:
  run:
    working-directory: ./website
```

Use `actions/setup-node` with `cache: 'npm'` and `cache-dependency-path: website/package-lock.json` so the npm cache resolves the lockfile inside `website/`.

→ verify: `grep -q 'working-directory' .github/workflows/ci.yml`

### Commit 7: Verify all tests pass with the new structure

Run the full verification suite from the website directory to confirm everything works:

```
cd website && npm install
npm run typecheck
npx vitest run
npm run build
```

Then from root, verify git hooks work:

```
npm install         # installs husky at root
npx lint-staged     # runs prettier on website/ files (dry run with --no-stash)
```

→ verify: `npm run typecheck && npx vitest run && npm run build` (from `website/`)

## Decision Document

### Modules built/modified

- **Root** (new/modified):
  - `package.json` — new minimal dev-tooling package
  - `.gitignore` — updated with website/ patterns
  - `lint-staged.config.js` — updated patterns with `website/` prefix
  - `.github/workflows/ci.yml` — added `working-directory: ./website`
  - `CLAUDE.md`, `CONVENTIONS.md`, `CONTRIBUTING.md` — restored to root
- **website/** (moved):
  - All source code, configs, and test files moved as listed above

### Technical clarifications

- `git mv` preserves file history — this is not a copy, it's a rename
- The root `package.json` has NO application dependencies — only dev tooling
- All relative paths in `website/` config files stay correct because the config files and their dependencies are in the same directory
- `astro.config.mjs` references `readFileSync('./package.json')` — this resolves to `website/package.json` correctly
- Husky's `core.hooksPath` stays at `.husky` (root level) — hooks run from root and `cd website` for `npx lint-staged`

### Architectural decisions

1. **Root = repository wrapper, website/ = application**: Clean separation of concerns
2. **Minimal root package.json**: Only dev tooling deps, no application code
3. **Hooks at root**: Git workflow is a repository concern, not an application concern
4. **No monorepo workspace**: The `website/` directory is not an npm workspace member — it's a flat self-contained app

## Testing Decisions

### What makes a good test

- Tests verify behavior through public interfaces, not internal state
- Tests survive refactors that move files or rename modules
- Tests assert on observable outcomes (API responses, UI state, user-visible effects)

### Test coverage for this refactor

This is a **structural refactor** — no logic changes. The test suite verifies that the move didn't break anything:

- All 21 existing unit tests cover the modules being moved (logger, validation, mock adapter)
- Tests run from `website/` with the same configs in the same relative paths
- The vitest config's `include: ['src/**/*.test.ts']` still resolves correctly from `website/`
- The playwright config's `testDir: './e2e'` still resolves to `website/e2e/`

### Prior art

- No similar refactor has been done in this project (new project)
- The existing vitest workspace/mock-adapter tests prove that relative-path-based configs work

## Out of Scope

- **Changing package.json contents**: The website's `package.json` stays as-is (no dep changes, no script changes)
- **Modifying application source code**: `src/` files are moved, not modified
- **Changing the CI platform or workflows**: Only adding `working-directory`
- **Adding/removing project features**: Pure structural reorganization
- **Splitting into multiple packages/monorepo**: The user explicitly chose flat move

## Further Notes

- After the refactor, open the `website/` directory in the editor/IDE for development work — all the code and configs are there
- When running agent commands, use `cd website && npm run <command>` pattern
- The `specs/` directory stays at root because it's project-level planning material, not website code
- To add a second package in the future (e.g., a shared UI library), the root could become an npm workspace at that time
