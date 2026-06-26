import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const MAIN_CSS = new URL('../../styles/main.css', import.meta.url).pathname;
const ASTRO_CONFIG = new URL('../../../astro.config.mjs', import.meta.url).pathname;
const FOOTER_COMPONENT = new URL('../../components/Footer.astro', import.meta.url).pathname;
const LAYOUT = new URL('../../layouts/Layout.astro', import.meta.url).pathname;

describe('e01s07: BigBase-style footer', () => {
  describe('Task 1: CSS design tokens', () => {
    const css = readFileSync(MAIN_CSS, 'utf-8');

    it('defines --color-fg', () => {
      expect(css).toMatch(/--color-fg/);
    });

    it('defines --color-bg', () => {
      expect(css).toMatch(/--color-bg/);
    });

    it('defines --color-accent', () => {
      expect(css).toMatch(/--color-accent/);
    });
  });

  describe('Task 2: Build-time version injection', () => {
    const config = readFileSync(ASTRO_CONFIG, 'utf-8');

    it('injects PUBLIC_APP_VERSION via vite.define', () => {
      expect(config).toMatch(/PUBLIC_APP_VERSION/);
    });
  });

  describe('Task 3: Footer.astro component', () => {
    it('exists', () => {
      expect(existsSync(FOOTER_COMPONENT)).toBe(true);
    });

    it('has a 3-column grid inner container', () => {
      const html = readFileSync(FOOTER_COMPONENT, 'utf-8');
      expect(html).toMatch(/footer-inner/);
    });

    it('has a bottom bar', () => {
      const html = readFileSync(FOOTER_COMPONENT, 'utf-8');
      expect(html).toMatch(/footer-bottom/);
    });
  });

  describe('Task 5: Footer applied in base layout', () => {
    it('imports Footer component', () => {
      const layout = readFileSync(LAYOUT, 'utf-8');
      expect(layout).toMatch(/Footer/);
    });
  });
});
