import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/adapter/postgres/connection';
import { createArticleAdapter } from '../../../../lib/adapter/postgres/article-adapter';

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return new Response(null, { status: 404 });

  const sql = getDb();
  const adapter = createArticleAdapter(sql);
  const article = await adapter.getArticle(id);

  if (!article) return new Response(null, { status: 404 });

  const translations = await adapter.getTranslations(id);

  return new Response(JSON.stringify({ article, translations }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) return new Response(null, { status: 404 });

  const body = await request.json();
  const sql = getDb();
  const adapter = createArticleAdapter(sql);

  // Update article fields
  const article = await adapter.updateArticle(id, {
    category: body.category,
    tags: body.tags,
    featured_image: body.featured_image,
    featured_image_alt: body.featured_image_alt,
    status: body.status,
    featured: body.featured,
  });

  return new Response(JSON.stringify(article), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return new Response(null, { status: 404 });

  const sql = getDb();
  const adapter = createArticleAdapter(sql);
  await adapter.deleteArticle(id);

  return new Response(null, { status: 204 });
};
