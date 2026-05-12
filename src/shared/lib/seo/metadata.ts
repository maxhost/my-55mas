import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import { SITE_BASE_URL, absoluteUrl } from './site';

type Args = {
  locale: string;
  /** Translation namespace with `title` + `description` keys. */
  namespace: string;
  /** Path WITHOUT the locale prefix (e.g. '/servicios'). Default '/'. */
  path?: string;
  /** Optional og:image override (absolute or app-relative). */
  ogImage?: string;
};

// Builder for generateMetadata across public routes. Resolves
// title + description from next-intl, computes canonical + hreflang
// alternates for every supported locale.
export async function buildPublicMetadata({
  locale,
  namespace,
  path = '/',
  ogImage,
}: Args): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });
  const cleanPath = path === '/' ? '' : path;
  const canonical = absoluteUrl(`/${locale}${cleanPath}`);

  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, absoluteUrl(`/${l}${cleanPath}`)]),
  ) as Record<string, string>;

  const title = t('title');
  const description = t('description');
  const image = ogImage ? absoluteUrl(ogImage) : undefined;

  return {
    metadataBase: new URL(SITE_BASE_URL),
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: 'website',
      siteName: '55+',
      title,
      description,
      url: canonical,
      locale,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
