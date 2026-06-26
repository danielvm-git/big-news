import type {
  StorageAdapter,
  ArticleData,
  TranslationData,
  UserData,
  SessionData,
  SettingsData,
  ArticleAdapter,
  AuthAdapter,
  FileStorageAdapter,
  SettingsAdapter,
} from '../types.js';

// ---------------------------------------------------------------------------
// In-memory ArticleAdapter
// ---------------------------------------------------------------------------

class InMemoryArticleAdapter implements ArticleAdapter {
  articles = new Map<string, ArticleData>();
  translations = new Map<string, TranslationData>();
  private nextId = 1;

  async createArticle(
    data: Omit<ArticleData, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ArticleData> {
    const id = String(this.nextId++);
    const now = new Date();
    const article: ArticleData = { id, ...data, created_at: now, updated_at: now };
    this.articles.set(id, article);
    return article;
  }

  async getArticle(id: string): Promise<ArticleData | null> {
    return this.articles.get(id) ?? null;
  }

  async updateArticle(id: string, data: Partial<ArticleData>): Promise<ArticleData> {
    const existing = this.articles.get(id);
    if (!existing) throw new Error(`Article not found: ${id}`);
    const updated = { ...existing, ...data, id, updated_at: new Date() };
    this.articles.set(id, updated);
    return updated;
  }

  async deleteArticle(id: string): Promise<void> {
    this.articles.delete(id);
    // Cascade delete translations
    for (const [tid, t] of this.translations) {
      if (t.article_id === id) this.translations.delete(tid);
    }
  }

  async listArticles(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ articles: ArticleData[]; total: number }> {
    const all = Array.from(this.articles.values());
    const total = all.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? total;
    return { articles: all.slice(offset, offset + limit), total };
  }

  async getArticleBySlug(slug: string, _locale: string): Promise<ArticleData | null> {
    const translation = Array.from(this.translations.values()).find((t) => t.slug === slug);
    if (!translation) return null;
    return this.articles.get(translation.article_id) ?? null;
  }

  async getPublishedArticles(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ articles: ArticleData[]; total: number }> {
    const published = Array.from(this.articles.values()).filter((a) => a.status === 'published');
    published.sort((a, b) => (b.published_at?.getTime() ?? 0) - (a.published_at?.getTime() ?? 0));
    const total = published.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? total;
    return { articles: published.slice(offset, offset + limit), total };
  }

  async getFeaturedArticles(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ articles: ArticleData[]; total: number }> {
    const featured = Array.from(this.articles.values()).filter(
      (a) => a.featured && a.status === 'published'
    );
    featured.sort((a, b) => (b.published_at?.getTime() ?? 0) - (a.published_at?.getTime() ?? 0));
    const total = featured.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? total;
    return { articles: featured.slice(offset, offset + limit), total };
  }

  async getArticlesByCategory(
    category: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ articles: ArticleData[]; total: number }> {
    const filtered = Array.from(this.articles.values()).filter(
      (a) => a.category === category && a.status === 'published'
    );
    const total = filtered.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? total;
    return { articles: filtered.slice(offset, offset + limit), total };
  }

  async searchArticles(query: string): Promise<ArticleData[]> {
    const lower = query.toLowerCase();
    return Array.from(this.articles.values()).filter((a) => {
      const translations = Array.from(this.translations.values()).filter(
        (t) => t.article_id === a.id
      );
      return translations.some(
        (t) => t.title.toLowerCase().includes(lower) || t.content.toLowerCase().includes(lower)
      );
    });
  }

  async createTranslation(data: Omit<TranslationData, 'id'>): Promise<TranslationData> {
    const id = String(this.nextId++);
    const translation: TranslationData = { id, ...data };
    this.translations.set(id, translation);
    return translation;
  }

  async getTranslations(articleId: string): Promise<TranslationData[]> {
    return Array.from(this.translations.values()).filter((t) => t.article_id === articleId);
  }

  async updateTranslation(id: string, data: Partial<TranslationData>): Promise<TranslationData> {
    const existing = this.translations.get(id);
    if (!existing) throw new Error(`Translation not found: ${id}`);
    const updated = { ...existing, ...data, id };
    this.translations.set(id, updated);
    return updated;
  }

  async deleteTranslation(id: string): Promise<void> {
    this.translations.delete(id);
  }
}

// ---------------------------------------------------------------------------
// In-memory AuthAdapter
// ---------------------------------------------------------------------------

class InMemoryAuthAdapter implements AuthAdapter {
  users = new Map<string, UserData>();
  sessions = new Map<string, SessionData>();
  /** Separate store for mock passwords — avoids type escapes on UserData */
  private passwords = new Map<string, string>();
  private nextUserId = 1;
  private nextSessionId = 1;

  async createUser(data: {
    email: string;
    name: string;
    password: string;
    role: UserData['role'];
  }): Promise<UserData> {
    const id = String(this.nextUserId++);
    const user: UserData = {
      id,
      email: data.email,
      name: data.name,
      role: data.role,
      created_at: new Date(),
    };
    this.users.set(id, user);
    this.passwords.set(id, data.password);
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<UserData | null> {
    const user = Array.from(this.users.values()).find((u) => u.email === email);
    if (!user) return null;
    const stored = this.passwords.get(user.id);
    if (stored !== password) return null;
    return user;
  }

  async createSession(userId: string): Promise<SessionData> {
    const id = String(this.nextSessionId++);
    const session: SessionData = {
      id,
      user_id: userId,
      token: `session-token-${id}`,
      expires_at: new Date(Date.now() + 86400000),
      created_at: new Date(),
    };
    this.sessions.set(session.token, session);
    return session;
  }

  async validateSession(token: string): Promise<UserData | null> {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (session.expires_at < new Date()) {
      this.sessions.delete(token);
      return null;
    }
    return this.users.get(session.user_id) ?? null;
  }

  async destroySession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async getUser(id: string): Promise<UserData | null> {
    return this.users.get(id) ?? null;
  }
}

// ---------------------------------------------------------------------------
// In-memory FileStorageAdapter
// ---------------------------------------------------------------------------

class InMemoryFileStorageAdapter implements FileStorageAdapter {
  files = new Map<string, { name: string; buffer: ArrayBuffer; mime_type: string }>();

  async uploadFile(
    file: { name: string; buffer: ArrayBuffer; mime_type: string },
    options?: { path?: string }
  ): Promise<{ url: string; key: string }> {
    const key = options?.path ? `${options.path}/${file.name}` : file.name;
    this.files.set(key, file);
    return { url: `https://storage.example.com/${key}`, key };
  }

  async getFileUrl(key: string): Promise<string> {
    if (!this.files.has(key)) throw new Error(`File not found: ${key}`);
    return `https://storage.example.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    this.files.delete(key);
  }
}

// ---------------------------------------------------------------------------
// In-memory SettingsAdapter
// ---------------------------------------------------------------------------

class InMemorySettingsAdapter implements SettingsAdapter {
  private settings: SettingsData | null = {
    site_name: 'Big News',
    tagline: 'The big news',
    description: 'A news site',
    logo_url: null,
    favicon_url: null,
    locale: 'en',
  };

  async getSettings(): Promise<SettingsData | null> {
    return this.settings;
  }

  async updateSettings(data: Partial<SettingsData>): Promise<SettingsData> {
    const current = this.settings ?? {
      site_name: '',
      tagline: '',
      description: '',
      logo_url: null,
      favicon_url: null,
      locale: 'en',
    };
    this.settings = { ...current, ...data };
    return this.settings;
  }
}

// ---------------------------------------------------------------------------
// Composed MockAdapter
// ---------------------------------------------------------------------------

export class MockAdapter implements StorageAdapter {
  articles = new InMemoryArticleAdapter();
  auth = new InMemoryAuthAdapter();
  storage = new InMemoryFileStorageAdapter();
  settings = new InMemorySettingsAdapter();
}
