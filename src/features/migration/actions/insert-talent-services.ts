import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { normalizeForMatch } from '@/shared/lib/i18n/localize';

type ServiceEntry = { serviceId: string; tier: string };
type SubtypeEntry = { groupId: string; names: string[] };

type InsertResult = {
  servicesInserted: number;
  subtypesInserted: number;
  warnings: string[];
};

/**
 * Insert talent_services and talent_service_subtypes for an imported talent.
 * - Services: one row per serviceId in talent_services
 * - Subtypes: lookup name → subtype_id, insert into talent_service_subtypes
 */
export async function insertTalentServices(
  admin: SupabaseClient<Database>,
  talentProfileId: string,
  countryId: string,
  services: ServiceEntry[],
  subtypeEntries: SubtypeEntry[],
  csvLocale: string
): Promise<InsertResult> {
  let servicesInserted = 0;
  let subtypesInserted = 0;
  const warnings: string[] = [];

  // Insert talent_services
  for (const svc of services) {
    // Skip empty/dash values — no service to create
    const raw = svc.tier.trim();
    if (!raw || raw === '-' || raw === '–' || raw === '—') continue;

    const parsed = parseFloat(raw);
    // Numeric → use as unit_price; text (e.g. "premium") → 0
    const unitPrice = Number.isNaN(parsed) ? 0 : parsed;

    const { error } = await admin.from('talent_services').insert({
      talent_id: talentProfileId,
      service_id: svc.serviceId,
      country_id: countryId,
      is_verified: false,
      unit_price: unitPrice,
    });

    if (error) {
      warnings.push(`Service ${svc.serviceId}: ${error.message}`);
    } else {
      servicesInserted++;
    }
  }

  // Insert talent_service_subtypes. Match name accent-insensitive against
  // i18n[csvLocale].name, fallback to i18n.es.name. Pulls all subtypes in the
  // group once and matches in JS (no SQL ilike now that translations live in jsonb).
  for (const entry of subtypeEntries) {
    const { data: subtypes } = await admin
      .from('service_subtypes')
      .select('id, i18n')
      .eq('group_id', entry.groupId);

    const target = (name: string) => {
      const normalized = normalizeForMatch(name);
      return (subtypes ?? []).find((st) => {
        const i18n = (st.i18n ?? {}) as Record<string, { name?: string } | null>;
        const localized = i18n[csvLocale]?.name ?? i18n.es?.name;
        return typeof localized === 'string' && normalizeForMatch(localized) === normalized;
      });
    };

    for (const name of entry.names) {
      const matched = target(name);
      if (matched) {
        const { error } = await admin.from('talent_service_subtypes').insert({
          talent_id: talentProfileId,
          subtype_id: matched.id,
        });

        if (error) {
          warnings.push(`Subtype "${name}": ${error.message}`);
        } else {
          subtypesInserted++;
        }
      } else {
        warnings.push(`Subtype not found: "${name}"`);
      }
    }
  }

  return { servicesInserted, subtypesInserted, warnings };
}
