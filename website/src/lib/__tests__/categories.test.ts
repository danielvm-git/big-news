import { describe, expect, it } from 'vitest';
import { CATEGORIES, type CategorySlug } from '../categories';

describe('CATEGORIES', () => {
  it('exports the four v1 English slugs', () => {
    const slugs = CATEGORIES.map((c) => c.slug);
    expect(slugs).toContain('news');
    expect(slugs).toContain('interviews');
    expect(slugs).toContain('analysis');
    expect(slugs).toContain('brazilian-research');
    expect(slugs).toHaveLength(4);
  });

  it('each category has a slug and a labelKey', () => {
    for (const cat of CATEGORIES) {
      expect(typeof cat.slug).toBe('string');
      expect(typeof cat.labelKey).toBe('string');
    }
  });
});

// Type-level smoke
const _check: CategorySlug = 'news';
void _check;
