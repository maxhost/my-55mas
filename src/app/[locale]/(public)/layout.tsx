import type { ReactNode } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';
import { getSelectedCity } from '@/shared/lib/country/cookie-server';
import { PublicHeader } from '@/shared/components/marketing/header';
import { PublicNavbar } from '@/shared/components/marketing/navbar';

type Props = {
  children: ReactNode;
  params: { locale: string };
};

// Public site layout (RSC). Wraps every page under (public) with the
// shared header + navbar. Footer + WhatsApp FAB land in fase 1.2.
// font-mulish applied here so admin keeps font-sans.
export default function PublicLayout({ children, params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const currentCity = getSelectedCity();

  return (
    <div className="font-mulish text-brand-text">
      <PublicHeader currentCity={currentCity} />
      <PublicNavbar />
      <main>{children}</main>
    </div>
  );
}
