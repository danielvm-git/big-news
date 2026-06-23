import { describe, expect, it } from 'vitest';
import { localeTagsMatch, normalizeLocaleTag, primaryLanguageSubtag } from '../locale';

describe('normalizeLocaleTag', () => {
  it('lowercases and replaces underscores', () => {
    expect(normalizeLocaleTag('PT_BR')).toBe('pt-br');
    expect(normalizeLocaleTag('  en  ')).toBe('en');
  });

  it('handles already normalized tags', () => {
    expect(normalizeLocaleTag('pt-br')).toBe('pt-br');
    expect(normalizeLocaleTag('en')).toBe('en');
  });

  it('handles mixed case with underscores', () => {
    expect(normalizeLocaleTag('En_Us')).toBe('en-us');
  });

  it('handles empty string', () => {
    expect(normalizeLocaleTag('')).toBe('');
  });

  it('handles whitespace-only string', () => {
    expect(normalizeLocaleTag('   ')).toBe('');
  });
});

describe('primaryLanguageSubtag', () => {
  it('returns first subtag', () => {
    expect(primaryLanguageSubtag('pt-br')).toBe('pt');
    expect(primaryLanguageSubtag('en')).toBe('en');
  });

  it('handles three-letter codes', () => {
    expect(primaryLanguageSubtag('zh-hans')).toBe('zh');
  });

  it('handles empty string', () => {
    expect(primaryLanguageSubtag('')).toBe('');
  });
});

describe('localeTagsMatch', () => {
  it('matches identical tags', () => {
    expect(localeTagsMatch('pt-br', 'pt-br')).toBe(true);
  });

  it('matches by primary subtag', () => {
    expect(localeTagsMatch('pt-br', 'pt-PT')).toBe(true);
    expect(localeTagsMatch('en-US', 'en-GB')).toBe(true);
  });

  it('does not match different languages', () => {
    expect(localeTagsMatch('pt-br', 'en')).toBe(false);
  });

  it('handles case-insensitive matching', () => {
    expect(localeTagsMatch('PT-BR', 'pt-br')).toBe(true);
    expect(localeTagsMatch('en-us', 'EN-US')).toBe(true);
  });

  it('handles underscore vs hyphen', () => {
    expect(localeTagsMatch('pt_BR', 'pt-BR')).toBe(true);
  });

  it('does not match empty strings as equal languages', () => {
    expect(localeTagsMatch('', '')).toBe(true);
  });
});
