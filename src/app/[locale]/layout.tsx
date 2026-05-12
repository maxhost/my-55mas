import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Mulish } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import { Toaster } from '@/components/ui/sonner';
import '@/app/globals.css';

// Mulish — brand font for the public site (Google Fonts, self-hosted by
// next/font). Exposed as the CSS var --font-mulish; mapped to the
// Tailwind utility "font-mulish" via globals.css @theme block.
const mulish = Mulish({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-mulish',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={mulish.variable}>
      <head>
        {/* Preconnect to known third-party origins so the browser opens
            TCP+TLS in parallel with HTML parsing. Cuts LCP for the
            Vimeo hero embed + Bubble CDN legacy images. */}
        <link rel="preconnect" href="https://player.vimeo.com" />
        <link rel="dns-prefetch" href="https://725e9d51ad7caf1033da4d1e65348273.cdn.bubble.io" />
        <link rel="dns-prefetch" href="https://i.vimeocdn.com" />
      </head>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
