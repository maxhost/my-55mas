import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

// Production-grade security headers applied site-wide. CSP is
// intentionally permissive on script-src ('unsafe-inline' +
// 'unsafe-eval') because Next.js relies on inline runtime scripts —
// a nonce-based CSP via middleware is the production-grade upgrade
// path (parked: see docs/features/public-home.md "Gaps conocidos").
const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.bubble.io https://api.mapbox.com",
      "frame-src 'self' https://player.vimeo.com https://www.youtube.com",
      "media-src 'self' https://player.vimeo.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Packages excluded from the server bundle, resolved at runtime from
  // node_modules instead. Required for:
  //  - sharp: native Node module used by cover-image upload; bundling
  //    would push the function over Vercel's 50 MB limit.
  //  - isomorphic-dompurify / jsdom: server-side HTML sanitizer pulls
  //    jsdom which has native bindings + ESM/CJS interop quirks that
  //    Next.js's bundler chokes on inside serverless functions. With
  //    these external, the action loads them at runtime cleanly.
  experimental: {
    serverComponentsExternalPackages: [
      'sharp',
      'isomorphic-dompurify',
      'jsdom',
    ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '725e9d51ad7caf1033da4d1e65348273.cdn.bubble.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Supabase Storage public objects (service covers, future buckets)
      { protocol: 'https', hostname: 'vkfolbfchkwezrbkxpiv.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
