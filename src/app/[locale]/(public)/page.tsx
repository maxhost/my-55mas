import { unstable_setRequestLocale } from 'next-intl/server';
import { HomeHero } from '@/features/public-home/components/home-hero';

type Props = { params: { locale: string } };

// Public home. Sections land progressively in fase 2.1 → 2.4.
// Header + navbar + newsletter + footer + FAB are in (public)/layout.tsx.
export default async function PublicHomePage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);

  return (
    <>
      <HomeHero />
      {/* fase 2.2: services section
          fase 2.3: how-it-works (talents + clients) + project
          fase 2.4: testimonials + join-cta + collaborators */}
    </>
  );
}
