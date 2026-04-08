'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormVariantSummary } from '@/shared/lib/forms/types';

/**
 * Lists all form variants (General + cities) for a registration form slug.
 * Used by the form builder's variant selector.
 * Pattern: 2 queries (forms + city names) — same as listTalentFormVariants.
 */
export async function listRegistrationVariants(
  slug: string
): Promise<FormVariantSummary[]> {
  const supabase = createClient();

  const { data: forms, error } = await supabase
    .from('registration_forms')
    .select('id, city_id, version, is_active')
    .eq('slug', slug)
    .order('city_id', { ascending: true, nullsFirst: true });

  if (error) throw error;
  if (!forms || forms.length === 0) return [];

  // Fetch city names separately (only for non-null city_ids)
  const cityIds = forms
    .map((f) => f.city_id)
    .filter((id): id is string => id !== null);

  let cityMap: Record<string, { name: string; country_id: string }> = {};

  if (cityIds.length > 0) {
    const { data: cityData } = await supabase
      .from('city_translations')
      .select('city_id, name, cities!inner(country_id)')
      .eq('locale', 'es')
      .in('city_id', cityIds);

    cityMap = Object.fromEntries(
      (cityData ?? []).map((c) => {
        const city = c.cities as unknown as { country_id: string };
        return [c.city_id, { name: c.name, country_id: city.country_id }];
      })
    );
  }

  return forms.map((f) => ({
    id: f.id,
    city_id: f.city_id,
    city_name: f.city_id ? (cityMap[f.city_id]?.name ?? null) : null,
    country_id: f.city_id ? (cityMap[f.city_id]?.country_id ?? null) : null,
    version: f.version,
    is_active: f.is_active,
  }));
}
