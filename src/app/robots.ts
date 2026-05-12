import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/shared/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/portal'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
