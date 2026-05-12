import { unstable_setRequestLocale } from 'next-intl/server';
import { getSelectedCity } from '@/shared/lib/country/cookie-server';
import { HomeHero } from '@/features/public-home/components/home-hero';
import { HomeServicesSection } from '@/features/public-home/components/home-services-section';
import { HomeHowtoTalents } from '@/features/public-home/components/home-howto-talents';
import { HomeHowtoClients } from '@/features/public-home/components/home-howto-clients';
import { HomeProject } from '@/features/public-home/components/home-project';

type Category = 'all' | 'accompaniment' | 'classes' | 'repairs' | 'home';

function normalizeCategory(raw: string | string[] | undefined): Category {
  const allowed: Category[] = ['all', 'accompaniment', 'classes', 'repairs', 'home'];
  if (typeof raw !== 'string') return 'all';
  return (allowed as string[]).includes(raw) ? (raw as Category) : 'all';
}

type Props = {
  params: { locale: string };
  searchParams: { cat?: string };
};

export default async function PublicHomePage({ params: { locale }, searchParams }: Props) {
  unstable_setRequestLocale(locale);
  const activeCategory = normalizeCategory(searchParams.cat);
  const city = getSelectedCity();

  return (
    <>
      <HomeHero />
      <HomeServicesSection activeCategory={activeCategory} cityLabel={city.label} />
      <HomeHowtoTalents />
      <HomeHowtoClients />
      <HomeProject />
      {/* fase 2.4: testimonials + join-cta + collaborators */}
    </>
  );
}
