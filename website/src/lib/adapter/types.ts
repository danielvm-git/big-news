// ---------------------------------------------------------------------------
// Domain types for the storage-adapter seam (ADR-0004)
// English-canonical, no Appwrite $id / $createdAt baggage
// ---------------------------------------------------------------------------

export interface ArticleData {
  id: string;
  category: string;
  tags: string[];
  featured_image: string;
  featured_image_alt: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  author_id: string;
  author_name: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TranslationData {
  id: string;
  article_id: string;
  language: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: Date;
}

export interface SettingsData {
  site_name: string;
  tagline: string;
  description: string;
  logo_url: string | null;
  favicon_url: string | null;
  locale: string;
}

export interface SessionData {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

// ---------------------------------------------------------------------------
// Sub-adapter interfaces
// ---------------------------------------------------------------------------

export interface ArticleAdapter {
  createArticle(data: Omit<ArticleData, 'id' | 'created_at' | 'updated_at'>): Promise<ArticleData>;
  getArticle(id: string): Promise<ArticleData | null>;
  updateArticle(id: string, data: Partial<ArticleData>): Promise<ArticleData>;
  deleteArticle(id: string): Promise<void>;
  listArticles(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ articles: ArticleData[]; total: number }>;
  getArticleBySlug(slug: string, locale: string): Promise<ArticleData | null>;
  getPublishedArticles(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ articles: ArticleData[]; total: number }>;
  getFeaturedArticles(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ articles: ArticleData[]; total: number }>;
  getArticlesByCategory(
    category: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ articles: ArticleData[]; total: number }>;
  searchArticles(
    query: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ArticleData[]>;

  // Translations
  createTranslation(data: Omit<TranslationData, 'id'>): Promise<TranslationData>;
  getTranslations(articleId: string): Promise<TranslationData[]>;
  updateTranslation(id: string, data: Partial<TranslationData>): Promise<TranslationData>;
  deleteTranslation(id: string): Promise<void>;
}

export interface AuthAdapter {
  createUser(data: {
    email: string;
    name: string;
    password: string;
    role: UserData['role'];
  }): Promise<UserData>;
  authenticateUser(email: string, password: string): Promise<UserData | null>;
  createSession(userId: string): Promise<SessionData>;
  validateSession(token: string): Promise<UserData | null>;
  destroySession(token: string): Promise<void>;
  getUser(id: string): Promise<UserData | null>;
}

export interface FileStorageAdapter {
  uploadFile(
    file: { name: string; buffer: ArrayBuffer; mime_type: string },
    options?: { path?: string }
  ): Promise<{ url: string; key: string }>;
  getFileUrl(key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
}

export interface SettingsAdapter {
  getSettings(): Promise<SettingsData | null>;
  updateSettings(data: Partial<SettingsData>): Promise<SettingsData>;
}

// ---------------------------------------------------------------------------
// Composed storage adapter — single boundary for the entire app
// ---------------------------------------------------------------------------

export interface StorageAdapter {
  articles: ArticleAdapter;
  auth: AuthAdapter;
  storage: FileStorageAdapter;
  settings: SettingsAdapter;
}
