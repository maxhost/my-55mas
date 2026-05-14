import DOMPurify from 'isomorphic-dompurify';

// Allowlist matches the output that Lexical's `$generateHtmlFromNodes`
// produces with the plugins enabled in our editor (rich-text + lists +
// links). Anything else gets stripped — including style/class attrs,
// event handlers, scripts and unsafe URI schemes.
const ALLOWED_TAGS = [
  'p',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'u',
  'a',
  'br',
];

const ALLOWED_ATTR = ['href', 'rel', 'target'];

export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Only allow safe URL schemes for <a href>.
    ALLOWED_URI_REGEXP: /^(https?:|mailto:)/i,
  });
}
