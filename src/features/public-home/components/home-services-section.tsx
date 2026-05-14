import { getTranslations } from 'next-intl/server';
import type { ServiceCategory } from '@/shared/lib/services/types';
import { loadHomeServices } from '../lib/load-home-services';
import { HomeServicesGrid } from './home-services-grid';

type CategoryKey = 'all' | ServiceCategory;

type Props = {
  /** Active filter from ?cat=... searchParam. Default 'all'. Only used
   *  for the FIRST render — subsequent filter clicks are client-only. */
  activeCategory: CategoryKey;
  /** Label of the currently selected city (from cookie). */
  cityLabel: string;
  /** Current request locale — used to pick localized name/benefits. */
  locale: string;
};

export async function HomeServicesSection({
  activeCategory,
  cityLabel,
  locale,
}: Props) {
  const t = await getTranslations('home.services');
  // Fetch all categorized published services once; client-side filtering
  // takes over from there so tab clicks never round-trip to the server.
  const services = await loadHomeServices(locale, 'all');

  return (
    <section id="services" className="bg-white px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="mb-5 text-center text-2xl font-bold text-brand-text md:mb-7 md:text-[2rem]">
          {t('sectionTitle')}
        </h2>

        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-cream px-3.5 py-2 text-[0.92rem]">
          <span aria-hidden="true">📍</span>
          <span>{t('locatorLabel')}</span>
          <span className="font-bold">{cityLabel}</span>
        </div>

        <HomeServicesGrid
          services={services}
          initialCategory={activeCategory}
          basePath="/"
          showViewAll
        />
      </div>
    </section>
  );
}
