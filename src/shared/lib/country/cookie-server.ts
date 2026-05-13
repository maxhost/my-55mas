import 'server-only';
import { cookies } from 'next/headers';
import { LOCATOR_CITIES, findCityBySlug, type LocatorCity } from './cities';
import { getDomainCountry } from './domain';

// Server-only helpers around the location cookie. The client counterpart
// lives in ./cookie-client.ts. Keeping them split prevents next/headers
// from leaking into the client bundle.

export const LOCATION_COOKIE = '55mas_location';

/**
 * Read the selected city from cookies. If the cookie is absent or
 * malformed, fall back to the first city whose countryCode matches the
 * domain TLD (.es → Spain, .pt → Portugal, …). Final fallback is the
 * first entry in LOCATOR_CITIES.
 */
export function getSelectedCity(): LocatorCity {
  const slug = cookies().get(LOCATION_COOKIE)?.value;
  if (slug) return findCityBySlug(slug);

  const country = getDomainCountry();
  const cityForCountry = LOCATOR_CITIES.find((c) => c.countryCode === country);
  return cityForCountry ?? LOCATOR_CITIES[0];
}
