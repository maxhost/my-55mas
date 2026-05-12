// Hardcoded city list for the public locator. Replaced with a Supabase
// query in fase 4 once we wire the public city catalog. Each city carries
// its slug (cookie value), display label, and parent country ISO code so
// downstream filters can derive country_id from the slug.

export type LocatorCity = {
  slug: string;
  label: string;
  countryCode: 'ES' | 'AR' | 'BR' | 'FR' | 'PT';
};

export const LOCATOR_CITIES: ReadonlyArray<LocatorCity> = [
  { slug: 'barcelona', label: 'Barcelona', countryCode: 'ES' },
  { slug: 'madrid', label: 'Madrid', countryCode: 'ES' },
];

export const DEFAULT_CITY_SLUG = 'barcelona';

export function findCityBySlug(slug: string | undefined | null): LocatorCity {
  const match = LOCATOR_CITIES.find((c) => c.slug === slug);
  return match ?? LOCATOR_CITIES[0];
}
