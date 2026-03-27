'use server';

import { createClient } from '@/lib/supabase/server';

type SubtypeOption = {
  id: string;
  slug: string;
  name: string;
};

/**
 * Gets active subtypes for a service, translated to a specific locale.
 * Used at runtime when rendering forms (e.g., subtype field type).
 */
export async function getSubtypes(
  serviceId: string,
  locale: string
): Promise<SubtypeOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('service_subtypes')
    .select(`
      id,
      slug,
      service_subtype_translations!inner(name)
    `)
    .eq('service_id', serviceId)
    .eq('is_active', true)
    .eq('service_subtype_translations.locale', locale)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const trans = row.service_subtype_translations as unknown as { name: string }[];
    return {
      id: row.id,
      slug: row.slug,
      name: trans[0]?.name ?? row.slug,
    };
  });
}
