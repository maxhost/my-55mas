'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';

export type SubtypeOption = {
  id: string;
  slug: string;
  name: string;
  group_slug: string;
};

type I18nRecord = Record<string, Record<string, unknown>> | null;

export async function getSubtypes(
  serviceId: string,
  locale: string,
  groupSlug?: string
): Promise<SubtypeOption[]> {
  const supabase = createClient();

  const { data: assignments } = await supabase
    .from('service_subtype_group_assignments')
    .select('group_id')
    .eq('service_id', serviceId);

  const groupIds = assignments?.map((a) => a.group_id) ?? [];
  if (groupIds.length === 0) return [];

  let query = supabase
    .from('service_subtypes')
    .select(`
      id,
      slug,
      sort_order,
      i18n,
      service_subtype_groups!inner(slug, is_active)
    `)
    .in('group_id', groupIds)
    .eq('is_active', true)
    .eq('service_subtype_groups.is_active', true)
    .order('sort_order', { ascending: true });

  if (groupSlug) {
    query = query.eq('service_subtype_groups.slug', groupSlug);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const group = row.service_subtype_groups as unknown as { slug: string };
    return {
      id: row.id,
      slug: row.slug,
      name: localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.slug,
      group_slug: group.slug,
    };
  });
}
