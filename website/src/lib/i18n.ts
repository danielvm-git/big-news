// ---------------------------------------------------------------------------
// Localized UI strings — lightweight i18n for UI text
// ---------------------------------------------------------------------------

export const LOCALES = ['en', 'pt-br'] as const;
export type Locale = (typeof LOCALES)[number];

type TranslationMap = Record<string, string>;

const translations: Record<Locale, TranslationMap> = {
  en: {
    'nav.home': 'Home',
    'nav.articles': 'Articles',
    'nav.categories': 'Categories',
    'nav.search': 'Search',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.privacy': 'Privacy',

    'article.read_more': 'Read more',
    'article.published_at': 'Published',
    'article.by': 'By',
    'article.featured': 'Featured',
    'article.no_articles': 'No articles found.',
    'article.latest': 'Latest Articles',

    'search.placeholder': 'Search articles...',
    'search.no_results': 'No results found.',
    'search.results_for': 'Results for',

    'footer.product': 'Product',
    'footer.resources': 'Resources',
    'footer.community': 'Community',
    'footer.built_with': 'Built with',

    'category.all': 'All Categories',

    'error.not_found': 'Page not found',
    'error.not_found_desc': 'The page you are looking for does not exist.',
    'error.server_error': 'Server error',
    'error.server_error_desc': 'Something went wrong. Please try again later.',
  },
  'pt-br': {
    'nav.home': 'Início',
    'nav.articles': 'Artigos',
    'nav.categories': 'Categorias',
    'nav.search': 'Buscar',
    'nav.about': 'Sobre',
    'nav.contact': 'Contato',
    'nav.privacy': 'Privacidade',

    'article.read_more': 'Ler mais',
    'article.published_at': 'Publicado em',
    'article.by': 'Por',
    'article.featured': 'Destaque',
    'article.no_articles': 'Nenhum artigo encontrado.',
    'article.latest': 'Artigos Recentes',

    'search.placeholder': 'Buscar artigos...',
    'search.no_results': 'Nenhum resultado encontrado.',
    'search.results_for': 'Resultados para',

    'footer.product': 'Produto',
    'footer.resources': 'Recursos',
    'footer.community': 'Comunidade',
    'footer.built_with': 'Feito com',

    'category.all': 'Todas as Categorias',

    'error.not_found': 'Página não encontrada',
    'error.not_found_desc': 'A página que você procura não existe.',
    'error.server_error': 'Erro do servidor',
    'error.server_error_desc': 'Algo deu errado. Tente novamente mais tarde.',
  },
};

/**
 * Translate a UI string key to the given locale.
 * Falls back to 'en' if the key is missing in the requested locale.
 */
export function t(key: string, locale: string = 'en'): string {
  const localeTranslations = translations[locale as Locale] ?? translations.en;
  return localeTranslations[key] ?? translations.en[key] ?? key;
}
