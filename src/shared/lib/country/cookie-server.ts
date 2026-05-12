import 'server-only';
import { cookies } from 'next/headers';
import { findCityBySlug, type LocatorCity } from './cities';

// Server-only helpers around the location cookie. The client counterpart
// lives in ./cookie-client.ts. Keeping them split prevents next/headers
// from leaking into the client bundle.

export const LOCATION_COOKIE = '55mas_location';

/**
 * Read the selected city from cookies. Defaults to the first city in
 * LOCATOR_CITIES if cookie missing or malformed.
 */
export function getSelectedCity(): LocatorCity {
  const slug = cookies().get(LOCATION_COOKIE)?.value;
  return findCityBySlug(slug);
}
