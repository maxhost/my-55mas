// Base URL for absolute links in sitemap, canonical, og:url. Override
// via NEXT_PUBLIC_SITE_URL in production (Netlify env). Falls back to
// the current 55mas.es domain.

export const SITE_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://55mas.es';

/** Build an absolute URL by joining the base with a path. */
export function absoluteUrl(path = ''): string {
  if (path.startsWith('http')) return path;
  return `${SITE_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
