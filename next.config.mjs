import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // next/image whitelist. Bubble CDN hosts legacy brand assets until
    // they finish migrating to local public/ + Supabase storage.
    // Unsplash covers placeholder service cards until fase 4.
    remotePatterns: [
      { protocol: 'https', hostname: '725e9d51ad7caf1033da4d1e65348273.cdn.bubble.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
