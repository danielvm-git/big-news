/**
 * lint-staged runs from the repo root; the app lives in website/.
 * Format staged source/config files with Prettier on commit.
 */
export default {
  "website/**/*.{js,ts,mjs,mts,cjs,cts,jsx,tsx,astro}": ["prettier --write"],
  "website/**/*.{json,md,yaml,yml,css}": ["prettier --write"],
  "*.{js,mjs,cjs,json,md,yaml,yml}": ["prettier --write"],
};
