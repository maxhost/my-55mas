'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
import { filterServices } from '../lib/filter-services';

type CategoryKey = 'all' | ServiceCategory;

const FILTER_KEYS: CategoryKey[] = [
  'all',
  'accompaniment',
  'classes',
  'repairs',
  'home',
];

// Reads the LIVE URL search at call time (always post-hydration:
// onClick handler / setTimeout in useEffect — never SSR/render).
// Correct primitive for "merge into the URL as it is right now",
// immune to React snapshot staleness → no category↔query race.
function buildMergedUrl(
  basePath: string,
  mutate: (p: URLSearchParams) => void,
): string {
  const p = new URLSearchParams(window.location.search);
  mutate(p);
  const qs = p.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

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
  /** Render the free-text search input above the filters. Default
   *  false → the home carousel stays untouched. */
  showSearch?: boolean;
  /** Seed for the search box from the ?q= searchParam (deep-link). */
  initialQuery?: string;
  /** Optional node rendered on the same row as the search input
   *  (desktop) — used by /servicios to put the city locator inline
   *  with the search box. Stacks above the input on mobile. */
  controlsSlot?: ReactNode;
  /** Optional node appended as the LAST grid item (grid layout only) —
   *  used by /servicios for the "suggest a service" CTA card. When
   *  present, an empty result set still renders the grid (just the
   *  CTA) instead of the empty-text paragraph. */
  gridCtaSlot?: ReactNode;
};

// Owns the filter state for the public services catalog. Filtering
// happens fully client-side over the pre-fetched list, so changing a
// filter or typing is instant and never reloads the page. The URL is
// kept in sync via `router.replace(..., { scroll: false })` so links
// are still shareable; other searchParams (utm_*, ref, etc.) are
// preserved untouched.
export function HomeServicesGrid({
  services,
  initialCategory,
  basePath = '/',
  showViewAll = true,
  layout = 'carousel',
  showSearch = false,
  initialQuery = '',
  controlsSlot,
  gridCtaSlot,
}: Props) {
  const t = useTranslations('home.services');
  const router = useRouter();
  const [active, setActive] = useState<CategoryKey>(initialCategory);
  const [query, setQuery] = useState(initialQuery);

  const handleSelect = (key: string) => {
    const next = key as CategoryKey;
    setActive(next);
    const url = buildMergedUrl(basePath, (p) => {
      if (next === 'all') p.delete('cat');
      else p.set('cat', next);
    });
    router.replace(url, { scroll: false });
  };

  // Debounced sync of ?q= only (filtering itself is instant via local
  // state). Reads the live URL at fire time → preserves cat/utm/ref
  // and avoids the category↔query race.
  useEffect(() => {
    const id = setTimeout(() => {
      const q = query.trim();
      const url = buildMergedUrl(basePath, (p) => {
        if (q) p.set('q', q);
        else p.delete('q');
      });
      router.replace(url, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
  }, [query, router, basePath]);

  const filterOptions: ServicesFilterOption[] = FILTER_KEYS.map((key) => ({
    key,
    label: t(`tabs.${key}`),
  }));

  const visible = filterServices(services, active, query);
  const Wrapper = layout === 'grid' ? ServicesGrid : ServicesCarousel;
  const trimmedQuery = query.trim();
  const hasGridCta = layout === 'grid' && Boolean(gridCtaSlot);
  const showEmptyText = visible.length === 0 && !hasGridCta;
  const emptyMsg = trimmedQuery
    ? t('emptyQuery', { query: trimmedQuery })
    : t(active === 'all' ? 'emptyAll' : 'emptyCategory');

  return (
    <>
      {showSearch && (
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end">
          {controlsSlot}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAria')}
            className="
              w-full max-w-[460px] rounded-full
              border-0 bg-brand-cream px-[18px] py-3
              text-base text-brand-text
              placeholder:text-brand-text/50
              focus:outline-none focus-visible:outline
              focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-brand-text
            "
          />
        </div>
      )}

      <ServicesFilter
        options={filterOptions}
        activeKey={active}
        onSelect={handleSelect}
        ariaLabel={t('tabsAria')}
      />

      {showSearch && trimmedQuery && (
        <p role="status" aria-live="polite" className="sr-only">
          {t('searchResultsStatus', { count: visible.length })}
        </p>
      )}

      {showEmptyText ? (
        <p className="my-10 text-center text-brand-text/70">{emptyMsg}</p>
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
          {hasGridCta ? gridCtaSlot : null}
        </Wrapper>
      )}

      {hasGridCta && visible.length === 0 && (
        <p role="status" aria-live="polite" className="sr-only">
          {emptyMsg}
        </p>
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
