'use server';

import { createClient } from '@/lib/supabase/server';

export type SubtypeOption = {
  id: string;
  slug: string;
  name: string;
  group_slug: string;
};

/**
 * Gets active subtypes for a service, translated to a specific locale.
 * Optionally filters by group slug (used when a form field targets a specific group).
 * Used at runtime when rendering forms (e.g., subtype field type).
 */
export async function getSubtypes(
  serviceId: string,
  locale: string,
  groupSlug?: string
): Promise<SubtypeOption[]> {
  const supabase = createClient();

  let query = supabase
    .from('service_subtypes')
    .select(`
      id,
      slug,
      service_subtype_translations!inner(name),
      service_subtype_groups!inner(slug)
    `)
    .eq('service_id', serviceId)
    .eq('is_active', true)
    .eq('service_subtype_translations.locale', locale)
    .eq('service_subtype_groups.is_active', true)
    .order('sort_order', { ascending: true });

  if (groupSlug) {
    query = query.eq('service_subtype_groups.slug', groupSlug);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const trans = row.service_subtype_translations as unknown as { name: string }[];
    const group = row.service_subtype_groups as unknown as { slug: string };
    return {
      id: row.id,
      slug: row.slug,
      name: trans[0]?.name ?? row.slug,
      group_slug: group.slug,
    };
  });
}
