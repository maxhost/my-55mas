import { SITE_CONFIG } from '@/shared/lib/site-config';
import { absoluteUrl } from './site';

// Type-safe-ish JSON-LD builders. Output is a plain object that the
// caller stringifies inside a <script type="application/ld+json">.

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.brandName,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/brand/logo.svg'),
    email: SITE_CONFIG.email,
    telephone: SITE_CONFIG.phone,
    address: SITE_CONFIG.offices.map((o) => ({
      '@type': 'PostalAddress',
      addressLocality: o.cityLabel,
      streetAddress: o.address,
      addressCountry: 'ES',
    })),
  };
}

export type ServiceItem = {
  name: string;
  description?: string;
  url: string;
  imageUrl?: string;
};

export function serviceItemListJsonLd(items: ServiceItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: it.name,
        description: it.description,
        url: absoluteUrl(it.url),
        image: it.imageUrl,
        provider: { '@type': 'Organization', name: SITE_CONFIG.brandName },
      },
    })),
  };
}
