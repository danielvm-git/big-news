import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/adapter/postgres/connection';
import { createArticleAdapter } from '../../../../lib/adapter/postgres/article-adapter';

export const GET: APIRoute = async () => {
  const sql = getDb();
  const adapter = createArticleAdapter(sql);
  const { articles, total } = await adapter.listArticles({ limit: 50, offset: 0 });

  return new Response(JSON.stringify({ articles, total }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();

  const sql = getDb();
  const adapter = createArticleAdapter(sql);

  const article = await adapter.createArticle({
    category: body.category ?? 'general',
    tags: body.tags ?? [],
    featured_image: body.featured_image ?? '',
    featured_image_alt: body.featured_image_alt ?? '',
    status: 'draft',
    featured: false,
    author_id: locals.user?.id ?? '',
    author_name: locals.user?.name ?? 'Unknown',
    published_at: null,
  });

  if (body.title) {
    await adapter.createTranslation({
      article_id: article.id,
      language: body.language ?? 'en',
      title: body.title,
      slug:
        body.slug ??
        body.title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
      excerpt: body.excerpt ?? '',
      content: body.content ?? '',
      meta_title: body.meta_title ?? '',
      meta_description: body.meta_description ?? '',
    });
  }

  return new Response(JSON.stringify(article), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
