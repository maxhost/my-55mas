import type { MetadataRoute } from 'next';
import { routing } from '@/lib/i18n/routing';
import { absoluteUrl } from '@/shared/lib/seo';

// Static set of public paths. Fase 4 may add dynamic service slugs
// from a Supabase query (export const dynamic = 'force-static' with
// revalidate).
const PUBLIC_PATHS = [
  '/',
  '/servicios',
  '/sobre-55',
  '/contratar',
  '/registro/talento',
  '/preguntas-frecuentes',
  '/privacidad',
  '/terminos-servicio',
  '/condiciones-sitio',
  '/transparencia',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PATHS.flatMap((path) => {
    const cleanPath = path === '/' ? '' : path;
    const languages = Object.fromEntries(
      routing.locales.map((l) => [l, absoluteUrl(`/${l}${cleanPath}`)]),
    );
    return routing.locales.map((locale) => ({
      url: absoluteUrl(`/${locale}${cleanPath}`),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: path === '/' ? 1 : 0.7,
      alternates: { languages },
    }));
  });
}
