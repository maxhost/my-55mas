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
 * Queries through the junction table to find assigned groups.
 * Optionally filters by group slug (used when a form field targets a specific group).
 */
export async function getSubtypes(
  serviceId: string,
  locale: string,
  groupSlug?: string
): Promise<SubtypeOption[]> {
  const supabase = createClient();

  // 1. Get group IDs assigned to this service via junction
  const { data: assignments } = await supabase
    .from('service_subtype_group_assignments')
    .select('group_id')
    .eq('service_id', serviceId);

  const groupIds = assignments?.map((a) => a.group_id) ?? [];
  if (groupIds.length === 0) return [];

  // 2. Query subtypes via group_ids
  let query = supabase
    .from('service_subtypes')
    .select(`
      id, slug,
      service_subtype_translations!inner(name),
      service_subtype_groups!inner(slug)
    `)
    .in('group_id', groupIds)
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
