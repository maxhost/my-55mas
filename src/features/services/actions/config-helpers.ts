import type { CityPriceInput, CountryPriceInput } from '../schemas';

/**
 * Computes the country rows for saveConfig, auto-calculating is_active
 * based on whether any city in that country is active.
 *
 * Pure function — no DB calls.
 */
export function computeCountryRows(
  configuredCountryIds: string[],
  templatePrices: Record<string, number>,
  cities: CityPriceInput[],
): CountryPriceInput[] {
  // Group active status by country
  const hasActiveCity = new Set<string>();
  for (const city of cities) {
    if (city.is_active) hasActiveCity.add(city.country_id);
  }

  return configuredCountryIds.map((countryId) => ({
    country_id: countryId,
    base_price: templatePrices[countryId] ?? 0,
    is_active: hasActiveCity.has(countryId),
  }));
}

/**
 * Checks if the service can be published:
 * requires at least 1 active city with base_price > 0.
 */
export function canPublish(cities: CityPriceInput[]): boolean {
  return cities.some((c) => c.is_active && c.base_price > 0);
}
