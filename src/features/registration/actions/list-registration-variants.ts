'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormVariantSummary } from '@/shared/lib/forms/types';

/**
 * Lists all form variants (General + cities) for a registration form slug.
 * Used by the form builder's variant selector.
 */
export async function listRegistrationVariants(
  slug: string
): Promise<FormVariantSummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('registration_forms')
    .select(`
      id,
      city_id,
      version,
      is_active,
      cities(name, country_id)
    `)
    .eq('slug', slug)
    .order('city_id', { ascending: true, nullsFirst: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const city = row.cities as unknown as { name: string; country_id: string } | null;
    return {
      id: row.id,
      city_id: row.city_id,
      city_name: city?.name ?? null,
      country_id: city?.country_id ?? null,
      version: row.version,
      is_active: row.is_active,
    };
  });
}
