import { describe, expect, it } from 'vitest';
import { ARTICLE_LOCALES, getArticleLocaleLabels, type ArticleLocale } from '../article-locales';

describe('ARTICLE_LOCALES', () => {
  it('is English-first with all 6 v1 locales', () => {
    expect(ARTICLE_LOCALES[0]).toBe('en');
    expect(ARTICLE_LOCALES).toContain('pt-br');
    expect(ARTICLE_LOCALES).toHaveLength(6);
  });
});

describe('getArticleLocaleLabels', () => {
  it('returns English labels for en UI locale', () => {
    const labels = getArticleLocaleLabels('en');
    expect(labels['en']).toBe('English');
    expect(labels['pt-br']).toBe('Portuguese');
  });

  it('returns Portuguese labels for pt-br UI locale', () => {
    const labels = getArticleLocaleLabels('pt-br');
    expect(labels['pt-br']).toBe('Português');
    expect(labels['en']).toBe('Inglês');
  });

  it('falls back to English for unknown UI locale', () => {
    const labels = getArticleLocaleLabels('xx-unknown');
    expect(labels['en']).toBe('English');
  });

  it('covers all ARTICLE_LOCALES keys in the returned map', () => {
    const labels = getArticleLocaleLabels('en');
    for (const locale of ARTICLE_LOCALES) {
      expect(labels).toHaveProperty(locale);
    }
  });
});

// Type-level smoke: ArticleLocale is a union of ARTICLE_LOCALES members
const _check: ArticleLocale = 'en';
void _check;
