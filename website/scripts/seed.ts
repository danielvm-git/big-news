// ---------------------------------------------------------------------------
// Seed script — creates first admin + demo data
// Idempotent: safe to run multiple times
// Usage: npx tsx scripts/seed.ts
// ---------------------------------------------------------------------------

import postgres from 'postgres';
import { hash } from 'argon2';
import { runMigrations } from '../src/lib/adapter/postgres/migrate';

const DEMO_ARTICLES = [
  {
    category: 'technology',
    tags: ['javascript', 'typescript', 'web'],
    status: 'published' as const,
    featured: true,
    translations: {
      en: {
        title: 'Getting Started with Astro 5',
        slug: 'getting-started-with-astro-5',
        excerpt:
          'A comprehensive guide to building fast websites with Astro 5 and its new features.',
        content:
          "<h2>Why Astro 5?</h2><p>Astro 5 brings significant performance improvements and a better developer experience. With its new content collections API and enhanced i18n support, it's the perfect choice for content-driven sites.</p><h3>Key Features</h3><ul><li>Zero JS by default</li><li>Islands architecture</li><li>Built-in Markdown support</li><li>Image optimization</li></ul><p>Getting started is as simple as <code>npm create astro@latest</code>.</p>",
      },
      'pt-br': {
        title: 'Começando com Astro 5',
        slug: 'comecando-com-astro-5',
        excerpt: 'Um guia completo para construir sites rápidos com Astro 5 e seus novos recursos.',
        content:
          '<h2>Por que Astro 5?</h2><p>Astro 5 traz melhorias significativas de performance e uma melhor experiência de desenvolvimento.</p>',
      },
    },
  },
  {
    category: 'technology',
    tags: ['postgresql', 'database', 'performance'],
    status: 'published' as const,
    featured: true,
    translations: {
      en: {
        title: 'PostgreSQL Performance Tips',
        slug: 'postgresql-performance-tips',
        excerpt: 'Essential PostgreSQL optimization techniques for better query performance.',
        content:
          '<h2>Indexing Matters</h2><p>Proper indexing is the single most impactful way to improve PostgreSQL performance. Use <code>EXPLAIN ANALYZE</code> to understand query plans.</p><h3>Key Takeaways</h3><ul><li>Use GIN indexes for full-text search</li><li>Consider partial indexes for filtered queries</li><li>Monitor query performance regularly</li></ul>',
      },
      'pt-br': {
        title: 'Dicas de Performance PostgreSQL',
        slug: 'dicas-de-performance-postgresql',
        excerpt:
          'Técnicas essenciais de otimização PostgreSQL para melhor performance de consultas.',
        content:
          '<p>Indexação adequada é a forma mais impactante de melhorar a performance do PostgreSQL.</p>',
      },
    },
  },
  {
    category: 'development',
    tags: ['typescript', 'patterns'],
    status: 'published' as const,
    featured: false,
    translations: {
      en: {
        title: 'TypeScript Patterns for Clean Code',
        slug: 'typescript-patterns-clean-code',
        excerpt: 'Learn battle-tested TypeScript patterns that make your code more maintainable.',
        content:
          '<h2>Discriminated Unions</h2><p>One of the most powerful TypeScript patterns is discriminated unions for handling different states.</p><pre><code>type Result<T> = { success: true; data: T } | { success: false; error: string };</code></pre>',
      },
    },
  },
  {
    category: 'open-source',
    tags: ['community', 'license'],
    status: 'published' as const,
    featured: false,
    translations: {
      en: {
        title: 'Building Open-Source Communities',
        slug: 'building-open-source-communities',
        excerpt: 'Lessons learned from growing open-source projects and their communities.',
        content:
          '<h2>Community First</h2><p>Open-source is about people, not code. Building a welcoming community is the foundation of sustainable open-source projects.</p><blockquote>The best open-source projects are those with thriving communities.</blockquote>',
      },
    },
  },
  {
    category: 'technology',
    tags: ['security', 'authentication'],
    status: 'published' as const,
    featured: true,
    translations: {
      en: {
        title: 'Modern Authentication Best Practices',
        slug: 'authentication-best-practices',
        excerpt: 'Secure your web application with these authentication best practices.',
        content:
          '<h2>Password Hashing</h2><p>Always use modern hashing algorithms like <strong>argon2</strong> for password storage. Never store plaintext passwords.</p><h3>Session Management</h3><ul><li>Use HttpOnly, Secure, SameSite cookies</li><li>Implement proper session expiration</li><li>Add CSRF protection</li></ul>',
      },
      'pt-br': {
        title: 'Melhores Práticas de Autenticação',
        slug: 'melhores-praticas-autenticacao',
        excerpt: 'Proteja sua aplicação web com estas melhores práticas de autenticação.',
        content:
          '<h2>Hash de Senhas</h2><p>Sempre use algoritmos modernos como argon2 para armazenamento de senhas.</p>',
      },
    },
  },
  {
    category: 'development',
    tags: ['testing', 'quality'],
    status: 'published' as const,
    featured: false,
    translations: {
      en: {
        title: 'Test-Driven Development Workflow',
        slug: 'tdd-workflow',
        excerpt: 'A practical guide to incorporating TDD into your daily development workflow.',
        content:
          '<h2>Red-Green-Refactor</h2><p>The TDD cycle is simple: write a failing test, make it pass, then refactor. Repeat.</p><ol><li>Write a test for the desired behavior</li><li>Run it — it should fail (red)</li><li>Write the minimal code to pass (green)</li><li>Refactor while keeping tests green</li></ol>',
      },
    },
  },
];

async function seedAdmin(
  sql: postgres.Sql | postgres.TransactionSql
): Promise<{ id: string; email: string; password_msg: string }> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@bignews.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const [existingAdmin] = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;

  if (existingAdmin) {
    console.log('Admin already exists, skipping...');
    return { id: existingAdmin.id, email: adminEmail, password_msg: '(already exists)' };
  }

  const passwordHash = await hash(adminPassword);
  const [admin] = await sql`
    INSERT INTO users (email, name, role, password_hash)
    VALUES (${adminEmail}, 'Admin', 'admin', ${passwordHash})
    RETURNING id
  `;
  console.log(`Admin created: ${adminEmail} / ${adminPassword}`);
  return { id: admin.id, email: adminEmail, password_msg: adminPassword };
}

async function seedArticles(
  sql: postgres.Sql | postgres.TransactionSql,
  adminId: string
): Promise<void> {
  for (const demo of DEMO_ARTICLES) {
    const enTranslation = demo.translations.en;
    const [existing] = await sql`
      SELECT a.id FROM articles a
      JOIN article_translations t ON t.article_id = a.id
      WHERE t.slug = ${enTranslation.slug} AND t.language = 'en'
    `;

    if (existing) {
      console.log(`Article "${enTranslation.title}" already exists, skipping...`);
      continue;
    }

    const [article] = await sql`
      INSERT INTO articles (category, tags, featured_image, featured_image_alt,
        status, featured, author_id, author_name, published_at, created_at, updated_at)
      VALUES (
        ${demo.category}, ${sql.array(demo.tags)}, '/images/placeholder.jpg', '',
        ${demo.status}, ${demo.featured}, ${adminId}, 'Admin',
        ${demo.status === 'published' ? new Date() : null}, now(), now()
      )
      RETURNING id
    `;

    for (const [lang, t] of Object.entries(demo.translations)) {
      await sql`
        INSERT INTO article_translations
          (article_id, language, title, slug, excerpt, content, meta_title, meta_description)
        VALUES (
          ${article.id}, ${lang}, ${t.title}, ${t.slug},
          ${t.excerpt}, ${t.content}, ${t.title}, ${t.excerpt}
        )
      `;
    }

    console.log(`  ✓ "${enTranslation.title}" (${demo.category})`);
  }
}

async function seedSettings(sql: postgres.Sql | postgres.TransactionSql): Promise<void> {
  const [existingSetting] = await sql`SELECT id FROM settings LIMIT 1`;
  if (!existingSetting) {
    await sql`
      INSERT INTO settings (site_name, tagline, description, locale)
      VALUES ('big-news', 'An open-source PostgreSQL news CMS',
              'Built with Astro 5+, PostgreSQL, and BigPowers', 'en')
    `;
    console.log('Settings seeded');
  } else {
    console.log('Settings already exist, skipping...');
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Error: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('Applying migrations...');
  await runMigrations();

  const sql = postgres(url, { max: 2 });

  try {
    await sql.begin(async (tx) => {
      const admin = await seedAdmin(tx);
      await seedArticles(tx, admin.id);
      await seedSettings(tx);

      console.log('\n✅ Seed complete!');
      console.log(`   Admin: ${admin.email} / ${admin.password_msg}`);
      console.log(`   Articles: ${DEMO_ARTICLES.length} demo articles`);
    });
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
