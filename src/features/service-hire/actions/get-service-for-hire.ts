'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type {
  AssignedSubtypeGroup,
  Question,
} from '@/shared/lib/questions';

export type ServiceForHire = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  questions: Question[];
  assignedGroups: AssignedSubtypeGroup[];
  /** Active countries for this service (where it can be hired). */
  activeCountryCodes: string[];
  /**
   * IANA timezone keyed by lowercase country code (e.g. 'es' → 'Europe/Madrid').
   * Used to display the service-local timezone next to the scheduling fields
   * once the user picks an address. Mirrors `countries.timezone`.
   */
  countryTimezones: Record<string, string>;
};

type I18nRecord = Record<string, Record<string, unknown>> | null;

export async function getServiceForHire(
  serviceId: string,
  locale: string,
): Promise<ServiceForHire | null> {
  const supabase = createClient();

  const { data: service } = await supabase
    .from('services')
    .select('id, slug, i18n, questions')
    .eq('id', serviceId)
    .eq('status', 'published')
    .maybeSingle();

  if (!service) return null;

  // Active countries for this service.
  const { data: countryRows } = await supabase
    .from('service_countries')
    .select('country_id, countries(code, is_active, timezone)')
    .eq('service_id', serviceId)
    .eq('is_active', true);

  const activeCountries = (countryRows ?? [])
    .map((row) => row.countries as unknown as { code: string; is_active: boolean; timezone: string } | null)
    .filter((c): c is { code: string; is_active: boolean; timezone: string } => !!c && c.is_active);

  const activeCountryCodes = activeCountries.map((c) => c.code);
  const countryTimezones: Record<string, string> = Object.fromEntries(
    activeCountries.map((c) => [c.code.toLowerCase(), c.timezone]),
  );

  // Assigned subtype groups (with items) — needed for renderer to resolve options.
  const { data: groupAssignments } = await supabase
    .from('service_subtype_group_assignments')
    .select(
      `service_id,
       group_id,
       service_subtype_groups (
         id, slug, i18n,
         service_subtypes ( id, slug, i18n, is_active, sort_order )
       )`,
    )
    .eq('service_id', serviceId);

  const assignedGroups: AssignedSubtypeGroup[] = (groupAssignments ?? [])
    .map((row) => {
      const g = row.service_subtype_groups as unknown as {
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
      if (!g) return null;
      const groupTranslations = extractTranslations(g.i18n, 'name');
      const items = (g.service_subtypes ?? [])
        .filter((it) => it.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((it) => ({
          id: it.id,
          slug: it.slug,
          translations: extractTranslations(it.i18n, 'name'),
        }));
      return {
        id: g.id,
        slug: g.slug,
        translations: groupTranslations,
        items,
      };
    })
    .filter((g): g is AssignedSubtypeGroup => g !== null);

  return {
    id: service.id,
    slug: service.slug,
    name: localizedField(service.i18n as I18nRecord, locale, 'name') ?? service.slug,
    description: localizedField(service.i18n as I18nRecord, locale, 'description'),
    questions: ((service.questions as unknown) as Question[]) ?? [],
    assignedGroups,
    activeCountryCodes,
    countryTimezones,
  };
}

function extractTranslations(
  i18n: I18nRecord,
  field: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!i18n) return out;
  for (const [locale, entry] of Object.entries(i18n)) {
    const v = (entry as Record<string, unknown>)[field];
    if (typeof v === 'string') out[locale] = v;
  }
  return out;
}
