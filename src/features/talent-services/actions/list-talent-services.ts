'use server';

import { createClient } from '@/lib/supabase/server';

export type TalentServiceListItem = {
  id: string;
  service_id: string;
  service_name: string;
  variant_count: number;
  updated_at: string | null;
};

/**
 * Lists General talent forms (one per service) for the admin list page.
 * Includes variant count per service.
 */
export async function listTalentServices(
  locale: string
): Promise<TalentServiceListItem[]> {
  const supabase = createClient();

  // Only General forms (city_id IS NULL)
  const { data: forms, error } = await supabase
    .from('talent_forms')
    .select('id, service_id, updated_at')
    .is('city_id', null)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  if (!forms || forms.length === 0) return [];

  const serviceIds = forms.map((f) => f.service_id);

  // Fetch service names and variant counts in parallel
  const [{ data: serviceNames }, { data: variants }] = await Promise.all([
    supabase
      .from('service_translations')
      .select('service_id, name')
      .eq('locale', locale)
      .in('service_id', serviceIds),
    supabase
      .from('talent_forms')
      .select('service_id')
      .not('city_id', 'is', null)
      .in('service_id', serviceIds),
  ]);

  const serviceNameMap = new Map(
    (serviceNames ?? []).map((s) => [s.service_id, s.name])
  );

  // Count variants per service
  const variantCountMap = new Map<string, number>();
  for (const v of variants ?? []) {
    variantCountMap.set(v.service_id, (variantCountMap.get(v.service_id) ?? 0) + 1);
  }

  return forms.map((f) => ({
    id: f.id,
    service_id: f.service_id,
    service_name: serviceNameMap.get(f.service_id) ?? f.service_id,
    variant_count: variantCountMap.get(f.service_id) ?? 0,
    updated_at: f.updated_at,
  }));
}
