import { getTranslations } from 'next-intl/server';
import { ServiceCard } from '@/shared/components/marketing/service-card';
import {
  ServicesCarousel,
  ServicesFilter,
  type ServicesFilterOption,
} from '@/shared/components/marketing/services-grid';
import type { ServiceCategory } from '@/shared/lib/services/types';
import { loadHomeServices } from '../lib/load-home-services';

type CategoryKey = 'all' | ServiceCategory;

type Props = {
  /** Active filter from ?cat=... searchParam. Default 'all'. */
  activeCategory: CategoryKey;
  /** Label of the currently selected city (from cookie). */
  cityLabel: string;
  /** Current request locale — used to pick localized name/benefits. */
  locale: string;
};

const FILTER_KEYS: CategoryKey[] = [
  'all',
  'accompaniment',
  'classes',
  'repairs',
  'home',
];

export async function HomeServicesSection({
  activeCategory,
  cityLabel,
  locale,
}: Props) {
  const t = await getTranslations('home.services');
  const services = await loadHomeServices(locale, activeCategory);

  const filterOptions: ServicesFilterOption[] = FILTER_KEYS.map((key) => ({
    key,
    label: t(`tabs.${key}`),
    href: key === 'all' ? '/' : `/?cat=${key}`,
  }));

  const emptyKey =
    activeCategory === 'all' ? 'emptyAll' : 'emptyCategory';

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

        <ServicesFilter
          options={filterOptions}
          activeKey={activeCategory}
          ariaLabel={t('tabsAria')}
        />

        {services.length === 0 ? (
          <p className="my-10 text-center text-brand-text/70">{t(emptyKey)}</p>
        ) : (
          <ServicesCarousel ariaLabel={t('carouselAria')}>
            {services.map((s) => (
              <ServiceCard
                key={s.id}
                href={`/servicios/${s.slug}`}
                imageSrc={s.imageSrc}
                imageAlt={s.imageAlt}
                category={{ label: t(`tabs.${s.category}`), tone: s.tone }}
                title={s.title}
                bullets={s.bullets}
              />
            ))}
          </ServicesCarousel>
        )}

        {services.length > 0 && (
          <div className="mt-7 text-center">
            <a
              href="/servicios"
              className="
                inline-flex items-center justify-center
                rounded-full bg-brand-mustard px-7 py-3.5
                text-base font-semibold text-brand-text
                hover:bg-brand-mustard-deep transition-colors
              "
            >
              {t('viewAll')}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
