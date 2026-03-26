'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormVariantSummary } from '../types';

export async function listFormVariants(
  serviceId: string
): Promise<FormVariantSummary[]> {
  const supabase = createClient();

  const { data: forms, error } = await supabase
    .from('service_forms')
    .select('id, city_id, version')
    .eq('service_id', serviceId)
    .eq('is_active', true)
    .order('city_id', { ascending: true, nullsFirst: true });

  if (error) throw error;
  if (!forms || forms.length === 0) return [];

  // Fetch city names + country_id for non-null city_ids
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
  }));
}
