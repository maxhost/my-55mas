import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { LegalSidebar } from '@/shared/components/marketing/legal-sidebar';

type Props = { children: ReactNode };

// Shared layout for the 5 legal/FAQ pages. Sidebar stays mounted across
// navigation between routes — only the right column re-renders.
export default async function LegalLayout({ children }: Props) {
  const t = await getTranslations('legal');
  const items = [
    { key: 'faq',          href: '/preguntas-frecuentes', label: t('nav.faq') },
    { key: 'terms',        href: '/condiciones-sitio',    label: t('nav.terms') },
    { key: 'privacy',      href: '/privacidad',           label: t('nav.privacy') },
    { key: 'termsOfUse',   href: '/terminos-servicio',    label: t('nav.termsOfUse') },
    { key: 'transparency', href: '/transparencia',        label: t('nav.transparency') },
  ];

  return (
    <div className="bg-white">
      <div className="h-[3px] bg-brand-red" />
      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr] md:gap-12">
          <aside>
            <LegalSidebar items={items} ariaLabel={t('navAriaLabel')} />
          </aside>
          <section>{children}</section>
        </div>
      </div>
    </div>
  );
}
