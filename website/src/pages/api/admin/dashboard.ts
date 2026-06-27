import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/adapter/postgres/connection';

export const GET: APIRoute = async () => {
  const sql = getDb();

  const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM articles`;
  const [{ published }] = await sql`
    SELECT COUNT(*)::int AS published FROM articles WHERE status = 'published'
  `;
  const [{ drafts }] = await sql`
    SELECT COUNT(*)::int AS drafts FROM articles WHERE status = 'draft'
  `;

  const recent = await sql`
    SELECT a.id, a.status, a.published_at, a.created_at,
           t.title, t.language
    FROM articles a
    LEFT JOIN article_translations t ON t.article_id = a.id AND t.language = 'en'
    ORDER BY a.created_at DESC
    LIMIT 5
  `;

  return new Response(
    JSON.stringify({
      stats: { total, published, drafts },
      recent: recent.map((r) => ({
        id: r.id,
        title: r.title ?? '(no title)',
        status: r.status,
        language: r.language ?? 'en',
        published_at: r.published_at,
        created_at: r.created_at,
      })),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
