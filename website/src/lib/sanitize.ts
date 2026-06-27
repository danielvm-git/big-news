// ---------------------------------------------------------------------------
// HTML sanitization utility — sanitize-on-write per ADR-0005
// ---------------------------------------------------------------------------

import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'strong',
  'em',
  'a',
  'img',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'blockquote',
  'p',
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href'],
  img: ['src'],
};

/**
 * Sanitize rich-text HTML before storage.
 *
 * Strips <script>, disallows javascript: URLs, and removes all tags
 * and attributes not in the allowlist.
 */
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  });
}
