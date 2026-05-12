import type { ReactNode } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';
import { getSelectedCity } from '@/shared/lib/country/cookie-server';
import { PublicHeader } from '@/shared/components/marketing/header';
import { PublicNavbar } from '@/shared/components/marketing/navbar';
import { NewsletterForm } from '@/shared/components/marketing/newsletter';
import { PublicFooter } from '@/shared/components/marketing/footer';
import { WhatsappFab } from '@/shared/components/marketing/whatsapp-fab';
import { JsonLdScript, organizationJsonLd } from '@/shared/lib/seo';

type Props = {
  children: ReactNode;
  params: { locale: string };
};

// Public site layout (RSC). Every page under (public) renders inside the
// shared shell: Header + Navbar above, Newsletter + Footer + WhatsApp FAB
// below. font-mulish applied here so admin keeps font-sans.
export default function PublicLayout({ children, params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const currentCity = getSelectedCity();

  return (
    <div className="font-mulish text-brand-text">
      <JsonLdScript id="ld-org" data={organizationJsonLd()} />
      <PublicHeader currentCity={currentCity} />
      <PublicNavbar />
      <main>{children}</main>
      <NewsletterForm />
      <PublicFooter />
      <WhatsappFab />
    </div>
  );
}
