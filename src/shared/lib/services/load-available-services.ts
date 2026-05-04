import type { SupabaseClient } from '@supabase/supabase-js';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { Database } from '@/lib/supabase/database.types';
import type { AssignedSubtypeGroup, Question } from '@/shared/lib/questions/types';
import type { AvailableService } from './types';
import { extractTranslations, type I18nRecord } from '@/shared/lib/json';

type Supabase = SupabaseClient<Database>;

/**
 * Loads the published services available in (countryId, optional cityId),
 * including their `talent_questions`, suggested price (city → country fallback),
 * and assigned subtype groups (for talent_questions with subtype source).
 */
export async function loadAvailableServices(
  supabase: Supabase,
  countryId: string,
  cityId: string | null,
  locale: string,
): Promise<AvailableService[]> {
  // 1. Services published + active in this country.
  const { data: scRows } = await supabase
    .from('service_countries')
    .select('service_id, base_price')
    .eq('country_id', countryId)
    .eq('is_active', true);

  const countryPrices = new Map<string, number>();
  for (const r of (scRows ?? []) as Array<{ service_id: string; base_price: number | string }>) {
    countryPrices.set(r.service_id, Number(r.base_price));
  }
  const serviceIds = Array.from(countryPrices.keys());
  if (serviceIds.length === 0) return [];

  const { data: services } = await supabase
    .from('services')
    .select('id, slug, status, i18n, talent_questions')
    .in('id', serviceIds)
    .eq('status', 'published');

  type ServiceRow = {
    id: string;
    slug: string;
    status: string;
    i18n: I18nRecord;
    talent_questions: unknown;
  };
  const publishedServices = (services ?? []) as ServiceRow[];
  const publishedServiceIds = publishedServices.map((s) => s.id);
  if (publishedServiceIds.length === 0) return [];

  // 2. City-specific prices override country defaults.
  const cityPrices = await loadCityPrices(supabase, cityId, publishedServiceIds);

  // 3. Subtype groups assigned per service.
  const groupsByService = await loadAssignedGroups(supabase, publishedServiceIds);

  return publishedServices.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: localizedField(s.i18n, locale, 'name') ?? s.slug,
    talent_questions: ((s.talent_questions as unknown) as Question[]) ?? [],
    assignedGroups: groupsByService.get(s.id) ?? [],
    suggested_price:
      cityPrices.get(s.id) ?? countryPrices.get(s.id) ?? null,
  }));
}

async function loadCityPrices(
  supabase: Supabase,
  cityId: string | null,
  serviceIds: string[],
): Promise<Map<string, number>> {
  const cityPrices = new Map<string, number>();
  if (!cityId) return cityPrices;
  const { data: scityRows } = await supabase
    .from('service_cities')
    .select('service_id, base_price')
    .eq('city_id', cityId)
    .eq('is_active', true)
    .in('service_id', serviceIds);
  for (const r of (scityRows ?? []) as Array<{ service_id: string; base_price: number | string }>) {
    cityPrices.set(r.service_id, Number(r.base_price));
  }
  return cityPrices;
}

async function loadAssignedGroups(
  supabase: Supabase,
  serviceIds: string[],
): Promise<Map<string, AssignedSubtypeGroup[]>> {
  const { data: rows } = await supabase
    .from('service_subtype_group_assignments')
    .select(
      `service_id,
       service_subtype_groups (
         id, slug, i18n,
         service_subtypes ( id, slug, i18n, is_active, sort_order )
       )`,
    )
    .in('service_id', serviceIds);

  const out = new Map<string, AssignedSubtypeGroup[]>();
  type Row = {
    service_id: string;
    service_subtype_groups: {
      id: string;
      slug: string;
      i18n: I18nRecord;
      service_subtypes: Array<{
        id: string;
        slug: string;
        i18n: I18nRecord;
        is_active: boolean;
        sort_order: number;
      }>;
    } | null;
  };
  for (const row of (rows ?? []) as Row[]) {
    const group = row.service_subtype_groups;
    if (!group) continue;
    const items = (group.service_subtypes ?? [])
      .filter((it) => it.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((it) => ({
        id: it.id,
        slug: it.slug,
        translations: extractTranslations(it.i18n, 'name'),
      }));
    const adapted: AssignedSubtypeGroup = {
      id: group.id,
      slug: group.slug,
      translations: extractTranslations(group.i18n, 'name'),
      items,
    };
    const list = out.get(row.service_id) ?? [];
    list.push(adapted);
    out.set(row.service_id, list);
  }
  return out;
}
