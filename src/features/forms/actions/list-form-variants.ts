'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormVariantSummary } from '../types';

export async function listFormVariants(
  serviceId: string
): Promise<FormVariantSummary[]> {
  const supabase = createClient();

  const { data: forms, error } = await supabase
    .from('service_forms')
    .select('id, country_id, version')
    .eq('service_id', serviceId)
    .eq('is_active', true)
    .order('country_id', { ascending: true, nullsFirst: true });

  if (error) throw error;
  if (!forms || forms.length === 0) return [];

  // Fetch country names for non-null country_ids
  const countryIds = forms
    .map((f) => f.country_id)
    .filter((id): id is string => id !== null);

  let countryMap: Record<string, string> = {};

  if (countryIds.length > 0) {
    const { data: countries } = await supabase
      .from('country_translations')
      .select('country_id, name')
      .eq('locale', 'es')
      .in('country_id', countryIds);

    countryMap = Object.fromEntries(
      (countries ?? []).map((c) => [c.country_id, c.name])
    );
  }

  return forms.map((f) => ({
    id: f.id,
    country_id: f.country_id,
    country_name: f.country_id ? (countryMap[f.country_id] ?? null) : null,
    version: f.version,
  }));
}
