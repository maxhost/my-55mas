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
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.bubble.io",
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
  // sharp is a native Node module used by our cover-image upload
  // Server Action. Excluding it from the server bundle keeps the
  // serverless function size below Vercel's 50 MB limit; sharp is
  // resolved at runtime from node_modules instead.
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
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
