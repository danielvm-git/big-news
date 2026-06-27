/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // ── articles ──────────────────────────────────────────────
  pgm.createTable('articles', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    category: { type: 'text', notNull: true },
    tags: { type: 'text[]', notNull: true, default: '{}' },
    featured_image: { type: 'text', notNull: true, default: '' },
    featured_image_alt: { type: 'text', notNull: true, default: '' },
    status: {
      type: 'text',
      notNull: true,
      default: 'draft',
      check: "status IN ('draft', 'published', 'archived')",
    },
    featured: { type: 'boolean', notNull: true, default: false },
    author_id: { type: 'uuid', notNull: true },
    author_name: { type: 'text', notNull: true },
    published_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('articles', 'status');
  pgm.createIndex('articles', 'featured');
  pgm.createIndex('articles', 'category');
  pgm.createIndex('articles', 'published_at');

  // ── article_translations ──────────────────────────────────
  pgm.createTable('article_translations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    article_id: { type: 'uuid', notNull: true, references: 'articles(id)', onDelete: 'CASCADE' },
    language: { type: 'text', notNull: true },
    title: { type: 'text', notNull: true },
    slug: { type: 'text', notNull: true },
    excerpt: { type: 'text', notNull: true, default: '' },
    content: { type: 'text', notNull: true, default: '' },
    meta_title: { type: 'text', notNull: true, default: '' },
    meta_description: { type: 'text', notNull: true, default: '' },
  });

  pgm.createIndex('article_translations', 'article_id');
  pgm.createIndex('article_translations', 'language');
  pgm.createIndex('article_translations', 'slug');
  pgm.addConstraint('article_translations', 'unique_article_language', {
    unique: ['article_id', 'language'],
  });

  // Full-text search index (GIN) — node-pg-migrate doesn't support
  // expression-based indexes via createIndex, so we use raw SQL.
  pgm.sql(`
    CREATE INDEX idx_article_translations_fts
    ON article_translations
    USING gin (
      to_tsvector('simple', title || ' ' || coalesce(excerpt, '') || ' ' || content)
    );
  `);

  // ── users ─────────────────────────────────────────────────
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'text', notNull: true, unique: true },
    name: { type: 'text', notNull: true },
    role: {
      type: 'text',
      notNull: true,
      default: 'viewer',
      check: "role IN ('admin', 'editor', 'viewer')",
    },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // ── settings ──────────────────────────────────────────────
  pgm.createTable('settings', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    site_name: { type: 'text', notNull: true, default: '' },
    tagline: { type: 'text', notNull: true, default: '' },
    description: { type: 'text', notNull: true, default: '' },
    logo_url: { type: 'text' },
    favicon_url: { type: 'text' },
    locale: { type: 'text', notNull: true, default: 'en' },
  });

  // ── sessions ──────────────────────────────────────────────
  pgm.createTable('sessions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    token: { type: 'text', notNull: true, unique: true },
    expires_at: { type: 'timestamptz', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('sessions', 'user_id');
  pgm.createIndex('sessions', 'token');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('sessions');
  pgm.dropTable('settings');
  pgm.dropTable('users');
  pgm.dropTable('article_translations');
  pgm.dropTable('articles');
};
