import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/i18n/routing';
import { Toaster } from '@/components/ui/sonner';
import { TalentServicesRenderersInit } from '@/features/talent-services/init/talent-services-renderers-init';
import '@/app/globals.css';

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
          {/*
           * TalentServicesRenderersInit registra el renderer del input_type
           * `talent_services_panel` en el registry shared. Es Client
           * Component (renderea null) — su sola inclusión asegura que
           * el módulo entre al client bundle y el side-effect register
           * corra browser-side. El FormRenderer (Client) hace lookup en
           * el mismo registry y encuentra el panel.
           */}
          <TalentServicesRenderersInit />
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
