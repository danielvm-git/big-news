// ---------------------------------------------------------------------------
// Unit tests for HTML sanitization utility (e02s07)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { sanitizeContent } from '../sanitize';

describe('sanitizeContent', () => {
  it('strips <script> tags', () => {
    const result = sanitizeContent('<p>hi</p><script>alert(1)</script>');
    expect(result).toContain('<p>hi</p>');
    expect(result).not.toContain('<script>');
  });

  it('preserves allowed formatting tags', () => {
    const html = '<p><strong>bold</strong> and <em>italic</em></p>';
    const result = sanitizeContent(html);

    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
    expect(result).toContain('bold');
    expect(result).toContain('italic');
  });

  it('drops javascript: URLs on href', () => {
    const result = sanitizeContent('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
    // The link text survives
    expect(result).toContain('click');
  });

  it('preserves a[href] with safe URLs', () => {
    const result = sanitizeContent('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
  });

  it('preserves img[src] with safe URLs', () => {
    const result = sanitizeContent('<img src="https://example.com/image.png" />');
    expect(result).toContain('src="https://example.com/image.png"');
  });

  it('preserves h2-h4, ul, ol, li, blockquote', () => {
    const html = `
      <h2>Title</h2>
      <blockquote>quote</blockquote>
      <ul><li>item</li></ul>
      <ol><li>ordered</li></ol>
    `;
    const result = sanitizeContent(html);

    expect(result).toContain('<h2>');
    expect(result).toContain('<blockquote>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>');
  });

  it('strips disallowed tags', () => {
    const result = sanitizeContent('<div>content</div><span>nope</span>');
    expect(result).not.toContain('<div>');
    expect(result).not.toContain('<span>');
    // Text content survives
    expect(result).toContain('content');
    expect(result).toContain('nope');
  });

  it('handles empty string', () => {
    expect(sanitizeContent('')).toBe('');
  });
});
