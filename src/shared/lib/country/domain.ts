import 'server-only';
import { headers } from 'next/headers';

// ISO country codes the public site currently recognises. Add to the
// HOST_TO_COUNTRY map below as new domains come online.
export type DomainCountry = 'ES' | 'PT' | 'BR' | 'FR' | 'AR';

/**
 * Default country when the Host header does not match any known TLD.
 * Spain is the primary market today.
 */
export const DEFAULT_DOMAIN_COUNTRY: DomainCountry = 'ES';

// Order matters — the first matching pattern wins. Match the TLD
// optionally followed by a port (handy for local dev / preview URLs
// like 55mas.es:3000).
const HOST_TO_COUNTRY: ReadonlyArray<[RegExp, DomainCountry]> = [
  [/\.com\.ar(:\d+)?$/, 'AR'],
  [/\.pt(:\d+)?$/, 'PT'],
  [/\.br(:\d+)?$/, 'BR'],
  [/\.fr(:\d+)?$/, 'FR'],
  [/\.es(:\d+)?$/, 'ES'],
];

/**
 * Resolves the country signalled by the current request's Host header.
 * Used by RSC layouts / Server Actions when no city cookie is present.
 * Cookie city, when set, takes precedence (the user explicitly picked
 * a city → its countryCode wins over the domain default).
 *
 * Today the public site only deploys to 55mas.es (returns 'ES'), but
 * the helper is ready for 55mas.pt / 55mas.fr / etc. to switch country
 * defaults automatically when those domains are added to DNS.
 */
export function getDomainCountry(): DomainCountry {
  const host = headers().get('host') ?? '';
  for (const [pattern, country] of HOST_TO_COUNTRY) {
    if (pattern.test(host)) return country;
  }
  return DEFAULT_DOMAIN_COUNTRY;
}
