import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      '',
      'Sitemap: https://news.bigbase.click/sitemap.xml',
    ].join('\n'),
    {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    }
  );
};
