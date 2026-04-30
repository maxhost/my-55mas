import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import { Toaster } from '@/components/ui/sonner';
import '@/app/globals.css';

// Side-effect imports: pueblan el registry de field-renderers con los
// renderers feature-specific. Sin esto, el dispatcher no encuentra el
// renderer del input_type talent_services_panel y devuelve null.
// Ver docs/features/talent-services-panel.md (sección Arquitectura).
import '@/features/talent-services/init/register-renderers';

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
    <html lang={locale}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
