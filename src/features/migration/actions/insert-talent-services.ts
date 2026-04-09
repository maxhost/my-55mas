import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

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

  // Insert talent_service_subtypes
  for (const entry of subtypeEntries) {
    for (const name of entry.names) {
      // Lookup subtype by name (case-insensitive) within the group
      const { data: subtypes } = await admin
        .from('service_subtypes')
        .select('id, service_subtype_translations!inner(name)')
        .eq('group_id', entry.groupId)
        .eq('service_subtype_translations.locale', csvLocale)
        .ilike('service_subtype_translations.name', name);

      if (subtypes && subtypes.length > 0) {
        const { error } = await admin.from('talent_service_subtypes').insert({
          talent_id: talentProfileId,
          subtype_id: subtypes[0].id,
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
