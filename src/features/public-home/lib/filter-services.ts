import { normalizeForMatch } from '@/shared/lib/i18n/localize';
import type { ServiceCategory } from '@/shared/lib/services/types';
import type { HomeServiceCard } from './load-home-services';

type CategoryKey = 'all' | ServiceCategory;

// Filters services by category (exact) AND free-text query. The query
// is matched accent/case-insensitively against the localized title +
// bullets. Multi-token query → ALL tokens must appear (AND) somewhere
// in the haystack, so "clases cocina" matches "Clases de cocina".
export function filterServices(
  services: HomeServiceCard[],
  category: CategoryKey,
  query: string,
): HomeServiceCard[] {
  const byCategory =
    category === 'all'
      ? services
      : services.filter((s) => s.category === category);

  const tokens = normalizeForMatch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return byCategory;

  return byCategory.filter((s) => {
    const haystack = normalizeForMatch(`${s.title} ${s.bullets.join(' ')}`);
    return tokens.every((tok) => haystack.includes(tok));
  });
}
