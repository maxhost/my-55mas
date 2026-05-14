'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ServiceCard } from '@/shared/components/marketing/service-card';
import {
  ServicesCarousel,
  ServicesFilter,
  type ServicesFilterOption,
} from '@/shared/components/marketing/services-grid';
import type { ServiceCategory } from '@/shared/lib/services/types';
import type { HomeServiceCard } from '../lib/load-home-services';

type CategoryKey = 'all' | ServiceCategory;

const FILTER_KEYS: CategoryKey[] = [
  'all',
  'accompaniment',
  'classes',
  'repairs',
  'home',
];

type Props = {
  services: HomeServiceCard[];
  initialCategory: CategoryKey;
};

// Owns the filter state for the home services section. Filtering happens
// fully client-side over the pre-fetched list, so clicking a filter is
// instant and never reloads the page. The URL is kept in sync via
// `router.replace(..., { scroll: false })` so links are still shareable.
export function HomeServicesGrid({ services, initialCategory }: Props) {
  const t = useTranslations('home.services');
  const router = useRouter();
  const [active, setActive] = useState<CategoryKey>(initialCategory);

  const handleSelect = (key: string) => {
    const next = key as CategoryKey;
    setActive(next);
    const url = next === 'all' ? '/' : `/?cat=${next}`;
    router.replace(url, { scroll: false });
  };

  const filterOptions: ServicesFilterOption[] = FILTER_KEYS.map((key) => ({
    key,
    label: t(`tabs.${key}`),
  }));

  const visible =
    active === 'all'
      ? services
      : services.filter((s) => s.category === active);

  return (
    <>
      <ServicesFilter
        options={filterOptions}
        activeKey={active}
        onSelect={handleSelect}
        ariaLabel={t('tabsAria')}
      />

      {visible.length === 0 ? (
        <p className="my-10 text-center text-brand-text/70">
          {t(active === 'all' ? 'emptyAll' : 'emptyCategory')}
        </p>
      ) : (
        <ServicesCarousel ariaLabel={t('carouselAria')}>
          {visible.map((s) => (
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

      {visible.length > 0 && (
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
    </>
  );
}
