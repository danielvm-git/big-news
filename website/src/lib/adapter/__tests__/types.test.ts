import { describe, it, expect, beforeEach } from 'vitest';
import type { StorageAdapter } from '../index.js';
import type {
  ArticleData,
  TranslationData,
  UserData,
  SettingsData,
  SessionData,
} from '../types.js';
import { MockAdapter } from './mock-adapter.js';

// ---------------------------------------------------------------------------
// Type-level checks — these verify the interface contract at the type level.
// If the test file compiles, the types satisfy the contract.
// ---------------------------------------------------------------------------

describe('Domain types', () => {
  it('ArticleData has required fields', () => {
    const article: ArticleData = {
      id: '1',
      category: 'tech',
      tags: ['astro'],
      featured_image: 'https://example.com/img.jpg',
      featured_image_alt: 'Example',
      status: 'published',
      featured: true,
      author_id: 'user1',
      author_name: 'Alice',
      published_at: new Date('2024-01-01'),
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    };
    expect(article.id).toBe('1');
    expect(article.status).toBe('published');
  });

  it('TranslationData has required fields', () => {
    const translation: TranslationData = {
      id: 't1',
      article_id: '1',
      language: 'en',
      title: 'Hello',
      slug: 'hello',
      excerpt: 'A post',
      content: '<p>Hello world</p>',
      meta_title: 'Hello',
      meta_description: 'A post about hello',
    };
    expect(translation.language).toBe('en');
    expect(translation.slug).toBe('hello');
  });

  it('UserData has required fields', () => {
    const user: UserData = {
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      role: 'admin',
      created_at: new Date(),
    };
    expect(user.email).toBe('alice@example.com');
  });

  it('SettingsData has required fields', () => {
    const settings: SettingsData = {
      site_name: 'Big News',
      tagline: 'The big news',
      description: 'A news site',
      logo_url: null,
      favicon_url: null,
      locale: 'en',
    };
    expect(settings.site_name).toBe('Big News');
  });

  it('SessionData has required fields', () => {
    const session: SessionData = {
      id: 's1',
      user_id: 'u1',
      token: 'abc123',
      expires_at: new Date(Date.now() + 86400000),
      created_at: new Date(),
    };
    expect(session.token).toBe('abc123');
  });
});

describe('ArticleAdapter', () => {
  // We test via MockAdapter since interfaces can't be instantiated directly
  let adapter: StorageAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  it('defines createArticle', () => {
    expect(typeof adapter.articles.createArticle).toBe('function');
  });

  it('defines getArticle', () => {
    expect(typeof adapter.articles.getArticle).toBe('function');
  });

  it('defines updateArticle', () => {
    expect(typeof adapter.articles.updateArticle).toBe('function');
  });

  it('defines deleteArticle', () => {
    expect(typeof adapter.articles.deleteArticle).toBe('function');
  });

  it('defines listArticles', () => {
    expect(typeof adapter.articles.listArticles).toBe('function');
  });

  it('defines getArticleBySlug', () => {
    expect(typeof adapter.articles.getArticleBySlug).toBe('function');
  });

  it('defines getPublishedArticles', () => {
    expect(typeof adapter.articles.getPublishedArticles).toBe('function');
  });

  it('defines getFeaturedArticles', () => {
    expect(typeof adapter.articles.getFeaturedArticles).toBe('function');
  });

  it('defines getArticlesByCategory', () => {
    expect(typeof adapter.articles.getArticlesByCategory).toBe('function');
  });

  it('defines searchArticles', () => {
    expect(typeof adapter.articles.searchArticles).toBe('function');
  });

  it('defines createTranslation', () => {
    expect(typeof adapter.articles.createTranslation).toBe('function');
  });

  it('defines getTranslations', () => {
    expect(typeof adapter.articles.getTranslations).toBe('function');
  });

  it('defines updateTranslation', () => {
    expect(typeof adapter.articles.updateTranslation).toBe('function');
  });

  it('defines deleteTranslation', () => {
    expect(typeof adapter.articles.deleteTranslation).toBe('function');
  });
});

describe('AuthAdapter', () => {
  let adapter: StorageAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  it('defines createUser', () => {
    expect(typeof adapter.auth.createUser).toBe('function');
  });

  it('defines authenticateUser', () => {
    expect(typeof adapter.auth.authenticateUser).toBe('function');
  });

  it('defines createSession', () => {
    expect(typeof adapter.auth.createSession).toBe('function');
  });

  it('defines validateSession', () => {
    expect(typeof adapter.auth.validateSession).toBe('function');
  });

  it('defines destroySession', () => {
    expect(typeof adapter.auth.destroySession).toBe('function');
  });

  it('defines getUser', () => {
    expect(typeof adapter.auth.getUser).toBe('function');
  });
});

describe('FileStorageAdapter', () => {
  let adapter: StorageAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  it('defines uploadFile', () => {
    expect(typeof adapter.storage.uploadFile).toBe('function');
  });

  it('defines getFileUrl', () => {
    expect(typeof adapter.storage.getFileUrl).toBe('function');
  });

  it('defines deleteFile', () => {
    expect(typeof adapter.storage.deleteFile).toBe('function');
  });
});

describe('SettingsAdapter', () => {
  let adapter: StorageAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  it('defines getSettings', () => {
    expect(typeof adapter.settings.getSettings).toBe('function');
  });

  it('defines updateSettings', () => {
    expect(typeof adapter.settings.updateSettings).toBe('function');
  });
});

describe('StorageAdapter composition', () => {
  it('has articles, auth, storage, and settings sub-adapters', () => {
    const adapter: StorageAdapter = new MockAdapter();
    expect(adapter.articles).toBeDefined();
    expect(adapter.auth).toBeDefined();
    expect(adapter.storage).toBeDefined();
    expect(adapter.settings).toBeDefined();
  });
});
