// Client-only helpers around the location cookie. Imported by client
// islands (e.g. the locator select). Server code uses ./cookie-server.

export const LOCATION_COOKIE = '55mas_location';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Write the selected city slug to the location cookie. Server reads it via
 * `getSelectedCity()` on the next request, so the caller should follow with
 * `router.refresh()` to trigger a fresh RSC render.
 */
export function writeLocationCookieClient(slug: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCATION_COOKIE}=${encodeURIComponent(slug)};path=/;max-age=${ONE_YEAR_SECONDS};SameSite=Lax`;
}
