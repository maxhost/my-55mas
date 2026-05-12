// Universal exports (safe in client + server). Cookie helpers live in
// ./cookie-server (server) and ./cookie-client (client) and must be
// imported from those modules directly. Splitting them prevents
// next/headers from leaking into client bundles.

export { LOCATOR_CITIES, DEFAULT_CITY_SLUG, findCityBySlug } from './cities';
export type { LocatorCity } from './cities';
