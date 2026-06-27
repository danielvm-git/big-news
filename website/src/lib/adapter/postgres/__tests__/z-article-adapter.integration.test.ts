// ---------------------------------------------------------------------------
// Integration tests for the PostgreSQL article adapter (e02s04)
// Requires a running Postgres on DATABASE_URL with migrations applied
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';
import { createArticleAdapter, pickTranslation } from '../article-adapter';
import type { ArticleData, TranslationData } from '../../types';

let sql: postgres.Sql;
let adapter: ReturnType<typeof createArticleAdapter>;
let createdIds: string[] = [];

beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  sql = postgres(url, { max: 2 });

  // Verify schema exists (assumes migrations have been applied externally)
  const [{ exists }] = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'articles'
    ) AS exists
  `;
  if (!exists) {
    // Apply migrations ourselves — idempotent once the schema exists
    const { runMigrations } = await import('../migrate');
    await runMigrations();
  }

  adapter = createArticleAdapter(sql);
});

afterAll(async () => {
  // Clean up any articles created during tests
  if (sql) {
    if (createdIds.length > 0) {
      await sql`DELETE FROM articles WHERE id = ANY(${createdIds})`.catch(() => {});
    }
    await sql.end();
  }
});

// ── Helpers ────────────────────────────────────────────────

function makeArticle(
  overrides: Partial<ArticleData> = {}
): Omit<ArticleData, 'id' | 'created_at' | 'updated_at'> {
  return {
    category: 'tech',
    tags: ['javascript', 'postgres'],
    featured_image: '/images/test.jpg',
    featured_image_alt: 'Test image',
    status: 'draft',
    featured: false,
    author_id: '00000000-0000-0000-0000-000000000001',
    author_name: 'Test Author',
    published_at: null,
    ...overrides,
  };
}

function makeTranslation(
  articleId: string,
  overrides: Partial<TranslationData> = {}
): Omit<TranslationData, 'id'> {
  return {
    article_id: articleId,
    language: 'en',
    title: 'Test Article',
    slug: 'test-article',
    excerpt: 'A test article',
    content: '<p>Hello world</p>',
    meta_title: 'Test Article | Big News',
    meta_description: 'A test article for integration testing',
    ...overrides,
  };
}

async function createArticle(
  overrides: Partial<ArticleData> = {},
  translationOverrides?: Partial<TranslationData>
): Promise<{ article: ArticleData; translation: TranslationData }> {
  const article = await adapter.createArticle(makeArticle(overrides));
  createdIds.push(article.id);

  const translation = await adapter.createTranslation(
    makeTranslation(article.id, translationOverrides)
  );

  return { article, translation };
}

describe('PostgreSQL article adapter', () => {
  it('create returns id + timestamps', async () => {
    const { article } = await createArticle();

    expect(article.id).toBeTruthy();
    expect(article.created_at).toBeInstanceOf(Date);
    expect(article.updated_at).toBeInstanceOf(Date);
    expect(article.status).toBe('draft');
  });

  it('publish makes article visible in published queries', async () => {
    const { article } = await createArticle({ status: 'draft' });

    // Before: not in published list
    const { articles: before } = await adapter.getPublishedArticles();
    expect(before.find((a) => a.id === article.id)).toBeUndefined();

    // Publish
    const published = await adapter.updateArticle(article.id, {
      status: 'published',
      published_at: new Date(),
    });
    expect(published.status).toBe('published');

    // After: in published list
    const { articles: after } = await adapter.getPublishedArticles();
    expect(after.find((a) => a.id === article.id)).toBeDefined();
  });

  it('list published returns 10 of 25 ordered by published_at DESC', async () => {
    // Create 25 published articles with staggered dates
    const ids: string[] = [];
    for (let i = 0; i < 25; i++) {
      const { article } = await createArticle({
        status: 'published',
        published_at: new Date(Date.now() - i * 60_000),
        author_name: `Author ${i}`,
      });
      ids.push(article.id);
    }

    const { articles, total } = await adapter.getPublishedArticles({ limit: 10, offset: 0 });

    expect(articles.length).toBe(10);
    expect(total).toBeGreaterThanOrEqual(25);

    // Verify descending order
    for (let i = 1; i < articles.length; i++) {
      expect(new Date(articles[i - 1].published_at!).getTime()).toBeGreaterThanOrEqual(
        new Date(articles[i].published_at!).getTime()
      );
    }
  });

  it('get by slug returns the right article (locale-aware)', async () => {
    const { article } = await createArticle(
      { status: 'published', published_at: new Date() },
      { language: 'en', slug: 'unique-slug-en' }
    );

    // Also create a pt-br translation for the same article
    await adapter.createTranslation(
      makeTranslation(article.id, { language: 'pt-br', slug: 'unique-slug-pt' })
    );

    const found = await adapter.getArticleBySlug('unique-slug-en', 'en');
    expect(found).not.toBeNull();
    expect(found!.id).toBe(article.id);

    const foundPt = await adapter.getArticleBySlug('unique-slug-pt', 'pt-br');
    expect(foundPt).not.toBeNull();
    expect(foundPt!.id).toBe(article.id);
  });

  it('pagination — page 1 limit 10 of 30 returns 10 + total 30', async () => {
    // Create 30 articles
    const ids: string[] = [];
    for (let i = 0; i < 30; i++) {
      const { article } = await createArticle();
      ids.push(article.id);
    }

    const { articles, total } = await adapter.listArticles({ limit: 10, offset: 0 });

    expect(articles.length).toBe(10);
    expect(total).toBeGreaterThanOrEqual(30);
  });

  it('delete cascades to translations', async () => {
    const { article } = await createArticle();

    // Confirm translations exist
    const transBefore = await adapter.getTranslations(article.id);
    expect(transBefore.length).toBeGreaterThan(0);

    // Delete the article
    await adapter.deleteArticle(article.id);

    // Confirm translations are gone (CASCADE)
    const transAfter = await adapter.getTranslations(article.id);
    expect(transAfter.length).toBe(0);
  });

  it('searchArticles finds by title, content, or excerpt', async () => {
    await createArticle(
      { status: 'published', published_at: new Date() },
      { title: 'Breaking News: Something Happened', slug: 'breaking-news' }
    );
    await createArticle(
      { status: 'published', published_at: new Date() },
      {
        title: 'Another Story',
        content: '<p>Something important happened today</p>',
        slug: 'another-story',
      }
    );
    await createArticle(
      { status: 'published', published_at: new Date() },
      { title: 'Weather Report', excerpt: 'Sunny with a chance of something', slug: 'weather' }
    );

    const results = await adapter.searchArticles('Something');

    expect(results.length).toBeGreaterThanOrEqual(3);
  });

  it('pickTranslation: requested locale → default en → first available', () => {
    const translations: TranslationData[] = [
      {
        id: '1',
        article_id: 'a1',
        language: 'en',
        title: 'Hello',
        slug: 'hello',
        excerpt: '',
        content: '',
        meta_title: '',
        meta_description: '',
      },
      {
        id: '2',
        article_id: 'a1',
        language: 'pt-br',
        title: 'Olá',
        slug: 'ola',
        excerpt: '',
        content: '',
        meta_title: '',
        meta_description: '',
      },
      {
        id: '3',
        article_id: 'a1',
        language: 'es',
        title: 'Hola',
        slug: 'hola',
        excerpt: '',
        content: '',
        meta_title: '',
        meta_description: '',
      },
    ];

    // Exact match
    expect(pickTranslation(translations, 'pt-br')!.language).toBe('pt-br');
    // Fallback to default 'en'
    expect(pickTranslation(translations, 'fr')!.language).toBe('en');
    // Empty list
    expect(pickTranslation([], 'en')).toBeNull();
    // No default match → first available
    const noEn = translations.filter((t) => t.language !== 'en');
    expect(pickTranslation(noEn, 'fr')!.language).toBe('pt-br');
  });
});
