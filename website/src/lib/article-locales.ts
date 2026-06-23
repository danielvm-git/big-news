export const ARTICLE_LOCALES = ['en', 'pt-br', 'es', 'nl', 'ja', 'zh'] as const;
export type ArticleLocale = (typeof ARTICLE_LOCALES)[number];

const LABELS: Record<string, Record<string, string>> = {
  en: {
    en: 'English',
    'pt-br': 'Portuguese',
    es: 'Spanish',
    nl: 'Dutch',
    ja: 'Japanese',
    zh: 'Chinese',
  },
  'pt-br': {
    en: 'Inglês',
    'pt-br': 'Português',
    es: 'Espanhol',
    nl: 'Holandês',
    ja: 'Japonês',
    zh: 'Chinês',
  },
  es: {
    en: 'Inglés',
    'pt-br': 'Portugués',
    es: 'Español',
    nl: 'Holandés',
    ja: 'Japonés',
    zh: 'Chino',
  },
  nl: {
    en: 'Engels',
    'pt-br': 'Portugees',
    es: 'Spaans',
    nl: 'Nederlands',
    ja: 'Japans',
    zh: 'Chinees',
  },
  ja: {
    en: '英語',
    'pt-br': 'ポルトガル語',
    es: 'スペイン語',
    nl: 'オランダ語',
    ja: '日本語',
    zh: '中国語',
  },
  zh: {
    en: '英语',
    'pt-br': '葡萄牙语',
    es: '西班牙语',
    nl: '荷兰语',
    ja: '日语',
    zh: '中文',
  },
};

export function getArticleLocaleLabels(uiLocale: string): Record<string, string> {
  return LABELS[uiLocale] ?? LABELS['en'];
}
