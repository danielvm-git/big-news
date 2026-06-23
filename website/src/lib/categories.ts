export const CATEGORIES = [
  { slug: 'news', labelKey: 'category.news' },
  { slug: 'interviews', labelKey: 'category.interviews' },
  { slug: 'analysis', labelKey: 'category.analysis' },
  { slug: 'brazilian-research', labelKey: 'category.brazilianResearch' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export interface Category {
  slug: CategorySlug;
  labelKey: string;
}
