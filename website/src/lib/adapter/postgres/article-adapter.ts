// ---------------------------------------------------------------------------
// PostgreSQL article adapter — implements ArticleAdapter over postgres.js
// ADR-0011: parameterized queries only (no string interpolation)
// ---------------------------------------------------------------------------

import type postgres from 'postgres';
import type { ArticleData, TranslationData, ArticleAdapter } from '../types';

// ---------------------------------------------------------------------------
// Row → domain mappers
// ---------------------------------------------------------------------------

function rowToArticle(row: postgres.Row): ArticleData {
  return {
    id: row.id as string,
    category: row.category as string,
    tags: row.tags as string[],
    featured_image: row.featured_image as string,
    featured_image_alt: row.featured_image_alt as string,
    status: row.status as ArticleData['status'],
    featured: row.featured as boolean,
    author_id: row.author_id as string,
    author_name: row.author_name as string,
    published_at: row.published_at as Date | null,
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
  };
}

function rowToTranslation(row: postgres.Row): TranslationData {
  return {
    id: row.id as string,
    article_id: row.article_id as string,
    language: row.language as string,
    title: row.title as string,
    slug: row.slug as string,
    excerpt: row.excerpt as string,
    content: row.content as string,
    meta_title: row.meta_title as string,
    meta_description: row.meta_description as string,
  };
}

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

/**
 * Create a PostgresArticleAdapter bound to a postgres.js connection.
 */
export function createArticleAdapter(sql: postgres.Sql): ArticleAdapter {
  return {
    // ── CRUD ────────────────────────────────────────────────
    async createArticle(data) {
      const [row] = await sql`
        INSERT INTO articles (category, tags, featured_image, featured_image_alt,
          status, featured, author_id, author_name, published_at)
        VALUES (
          ${data.category}, ${data.tags}, ${data.featured_image},
          ${data.featured_image_alt}, ${data.status}, ${data.featured},
          ${data.author_id}, ${data.author_name}, ${data.published_at}
        )
        RETURNING *
      `;
      return rowToArticle(row);
    },

    async getArticle(id) {
      const [row] = await sql`SELECT * FROM articles WHERE id = ${id}`;
      return row ? rowToArticle(row) : null;
    },

    async updateArticle(id, data) {
      // Read current, merge, write all
      const current = await this.getArticle(id);
      if (!current) throw new Error(`Article not found: ${id}`);

      const merged = { ...current, ...data, updated_at: new Date() };

      const [row] = await sql`
        UPDATE articles SET
          category = ${merged.category},
          tags = ${merged.tags},
          featured_image = ${merged.featured_image},
          featured_image_alt = ${merged.featured_image_alt},
          status = ${merged.status},
          featured = ${merged.featured},
          author_id = ${merged.author_id},
          author_name = ${merged.author_name},
          published_at = ${merged.published_at},
          updated_at = now()
        WHERE id = ${id}
        RETURNING *
      `;
      return rowToArticle(row);
    },

    async deleteArticle(id) {
      await sql`DELETE FROM articles WHERE id = ${id}`;
    },

    // ── List / query ────────────────────────────────────────

    async listArticles(options) {
      const limit = options?.limit ?? 10;
      const offset = options?.offset ?? 0;

      const rows = await sql`
        SELECT * FROM articles
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM articles`;

      return {
        articles: rows.map(rowToArticle),
        total: count as number,
      };
    },

    async getArticleBySlug(slug, locale) {
      // Join with translations to find by slug; locale-aware
      const [row] = await sql`
        SELECT a.*
        FROM articles a
        JOIN article_translations t ON t.article_id = a.id
        WHERE t.slug = ${slug}
          AND t.language = ${locale}
        LIMIT 1
      `;
      return row ? rowToArticle(row) : null;
    },

    async getPublishedArticles(options) {
      const limit = options?.limit ?? 10;
      const offset = options?.offset ?? 0;

      const rows = await sql`
        SELECT * FROM articles
        WHERE status = 'published'
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [{ count }] = await sql`
        SELECT COUNT(*)::int AS count FROM articles WHERE status = 'published'
      `;

      return {
        articles: rows.map(rowToArticle),
        total: count as number,
      };
    },

    async getFeaturedArticles(options) {
      const limit = options?.limit ?? 10;
      const offset = options?.offset ?? 0;

      const rows = await sql`
        SELECT * FROM articles
        WHERE featured = true AND status = 'published'
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [{ count }] = await sql`
        SELECT COUNT(*)::int AS count FROM articles
        WHERE featured = true AND status = 'published'
      `;

      return {
        articles: rows.map(rowToArticle),
        total: count as number,
      };
    },

    async getArticlesByCategory(category, options) {
      const limit = options?.limit ?? 10;
      const offset = options?.offset ?? 0;

      const rows = await sql`
        SELECT * FROM articles
        WHERE category = ${category}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [{ count }] = await sql`
        SELECT COUNT(*)::int AS count FROM articles WHERE category = ${category}
      `;

      return {
        articles: rows.map(rowToArticle),
        total: count as number,
      };
    },

    async searchArticles(query, options) {
      const limit = options?.limit ?? 10;
      const offset = options?.offset ?? 0;

      const rows = await sql`
        SELECT a.*
        FROM articles a
        JOIN article_translations t ON t.article_id = a.id
        WHERE t.content ILIKE ${'%' + query + '%'}
           OR t.title ILIKE ${'%' + query + '%'}
           OR t.excerpt ILIKE ${'%' + query + '%'}
        ORDER BY
          CASE WHEN t.title ILIKE ${query + '%'} THEN 0
               WHEN t.title ILIKE ${'%' + query + '%'} THEN 1
               ELSE 2
          END
        LIMIT ${limit} OFFSET ${offset}
      `;

      return rows.map(rowToArticle);
    },

    // ── Translations ────────────────────────────────────────

    async createTranslation(data) {
      const [row] = await sql`
        INSERT INTO article_translations
          (article_id, language, title, slug, excerpt, content, meta_title, meta_description)
        VALUES (
          ${data.article_id}, ${data.language}, ${data.title}, ${data.slug},
          ${data.excerpt}, ${data.content}, ${data.meta_title}, ${data.meta_description}
        )
        RETURNING *
      `;
      return rowToTranslation(row);
    },

    async getTranslations(articleId) {
      const rows = await sql`
        SELECT * FROM article_translations
        WHERE article_id = ${articleId}
        ORDER BY language
      `;
      return rows.map(rowToTranslation);
    },

    async updateTranslation(id, data) {
      // Read current translation, merge, write all
      const [current] = await sql`SELECT * FROM article_translations WHERE id = ${id}`;
      if (!current) throw new Error(`Translation not found: ${id}`);

      const merged = { ...rowToTranslation(current), ...data };

      const [row] = await sql`
        UPDATE article_translations SET
          language = ${merged.language},
          title = ${merged.title},
          slug = ${merged.slug},
          excerpt = ${merged.excerpt},
          content = ${merged.content},
          meta_title = ${merged.meta_title},
          meta_description = ${merged.meta_description}
        WHERE id = ${id}
        RETURNING *
      `;
      return rowToTranslation(row);
    },

    async deleteTranslation(id) {
      await sql`DELETE FROM article_translations WHERE id = ${id}`;
    },
  };
}

// ---------------------------------------------------------------------------
// Locale-aware translation picker
// ---------------------------------------------------------------------------

/**
 * Pick the best available translation from a list.
 *
 * Priority: requested locale → default locale ('en') → first available.
 */
export function pickTranslation(
  translations: TranslationData[],
  requestedLocale: string,
  defaultLocale = 'en'
): TranslationData | null {
  if (translations.length === 0) return null;

  const exact = translations.find((t) => t.language === requestedLocale);
  if (exact) return exact;

  const fallback = translations.find((t) => t.language === defaultLocale);
  if (fallback) return fallback;

  return translations[0];
}
