'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ServiceCard } from '@/shared/components/marketing/service-card';
import {
  ServicesCarousel,
  ServicesGrid,
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
  /** Base path for router.replace on filter click. Default '/' (home). */
  basePath?: string;
  /** Show the "View all services" CTA below the grid. Default true
   *  (home). The /servicios page passes false because it already
   *  shows the full catalog. */
  showViewAll?: boolean;
  /** 'carousel' (home, horizontal scroll) | 'grid' (/servicios,
   *  3-col full listing). Default 'carousel' — backward-compat. */
  layout?: 'carousel' | 'grid';
};

// Owns the filter state for the public services catalog. Filtering
// happens fully client-side over the pre-fetched list, so clicking a
// filter is instant and never reloads the page. The URL is kept in
// sync via `router.replace(..., { scroll: false })` so links are
// still shareable; other searchParams (utm_*, ref, etc.) are
// preserved untouched.
export function HomeServicesGrid({
  services,
  initialCategory,
  basePath = '/',
  showViewAll = true,
  layout = 'carousel',
}: Props) {
  const t = useTranslations('home.services');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<CategoryKey>(initialCategory);

  const handleSelect = (key: string) => {
    const next = key as CategoryKey;
    setActive(next);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (next === 'all') {
      params.delete('cat');
    } else {
      params.set('cat', next);
    }
    const qs = params.toString();
    const url = qs ? `${basePath}?${qs}` : basePath;
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

  const Wrapper = layout === 'grid' ? ServicesGrid : ServicesCarousel;

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
        <Wrapper ariaLabel={t('carouselAria')}>
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
        </Wrapper>
      )}

      {visible.length > 0 && showViewAll && (
        <div className="mt-7 text-center">
          <Link
            href="/servicios"
            className="
              inline-flex items-center justify-center
              rounded-full bg-brand-mustard px-7 py-3.5
              text-base font-semibold text-brand-text
              hover:bg-brand-mustard-deep transition-colors
            "
          >
            {t('viewAll')}
          </Link>
        </div>
      )}
    </>
  );
}
