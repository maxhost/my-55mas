import { describe, it, expect } from 'vitest';
import { sanitizeRichHtml } from '../sanitize-rich-html';

describe('sanitizeRichHtml', () => {
  it('preserves allowed tags and structure', () => {
    const input =
      '<p>Hello <strong>world</strong> <em>!</em></p><h2>Title</h2><h3>Sub</h3><ul><li>One</li></ul>';
    expect(sanitizeRichHtml(input)).toBe(input);
  });

  it('strips <script> tags', () => {
    const out = sanitizeRichHtml('<p>x</p><script>alert(1)</script>');
    expect(out).toBe('<p>x</p>');
    expect(out).not.toContain('script');
  });

  it('strips style and class attributes', () => {
    const out = sanitizeRichHtml(
      '<p style="color:red" class="x">hi</p>',
    );
    expect(out).toBe('<p>hi</p>');
    expect(out).not.toContain('style');
    expect(out).not.toContain('class');
  });

  it('strips event handlers like onclick', () => {
    const out = sanitizeRichHtml('<p onclick="alert(1)">x</p>');
    expect(out).toBe('<p>x</p>');
    expect(out).not.toContain('onclick');
  });

  it('preserves safe http/https links', () => {
    const out = sanitizeRichHtml('<a href="https://example.com">x</a>');
    expect(out).toContain('href="https://example.com"');
  });

  it('preserves mailto: links', () => {
    const out = sanitizeRichHtml('<a href="mailto:hi@example.com">x</a>');
    expect(out).toContain('mailto:hi@example.com');
  });

  it('strips javascript: links', () => {
    const out = sanitizeRichHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript');
  });

  it('strips data: links', () => {
    const out = sanitizeRichHtml(
      '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    );
    expect(out).not.toContain('data:');
  });

  it('drops disallowed tags (img, iframe, table)', () => {
    const out = sanitizeRichHtml(
      '<p>x</p><img src="x.png"/><iframe src="x"></iframe><table><tr><td>cell</td></tr></table>',
    );
    // Disallowed tags are stripped; DOMPurify preserves inner text by default,
    // which is acceptable — no executable / injectable content remains.
    expect(out).not.toContain('<img');
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('<table');
    expect(out).not.toContain('<tr');
    expect(out).not.toContain('<td');
    expect(out).toContain('<p>x</p>');
  });
});
