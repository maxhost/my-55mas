'use server';

import { createClient } from '@/lib/supabase/server';
import type { SubtypeGroupWithTranslations } from '../types';

/**
 * Lists ALL subtype groups globally (no service filter).
 * Used by the standalone /admin/subtypes page.
 */
export async function listAllSubtypes(): Promise<SubtypeGroupWithTranslations[]> {
  const supabase = createClient();

  const { data: groups, error: groupsError } = await supabase
    .from('service_subtype_groups')
    .select('id, slug, sort_order, is_active, service_subtype_group_translations(locale, name)')
    .order('sort_order', { ascending: true });

  if (groupsError) throw groupsError;
  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map((g) => g.id);

  const { data: items, error: itemsError } = await supabase
    .from('service_subtypes')
    .select('id, group_id, slug, sort_order, is_active, service_subtype_translations(locale, name)')
    .in('group_id', groupIds)
    .order('sort_order', { ascending: true });

  if (itemsError) throw itemsError;

  const itemsByGroup = new Map<string, SubtypeGroupWithTranslations['items']>();
  for (const item of items ?? []) {
    const trans: Record<string, string> = {};
    const rawTrans = item.service_subtype_translations as unknown as { locale: string; name: string }[];
    for (const t of rawTrans) trans[t.locale] = t.name;

    if (!itemsByGroup.has(item.group_id)) itemsByGroup.set(item.group_id, []);
    itemsByGroup.get(item.group_id)!.push({
      id: item.id,
      group_id: item.group_id,
      slug: item.slug,
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active,
      translations: trans,
    });
  }

  return groups.map((g) => {
    const trans: Record<string, string> = {};
    const rawTrans = g.service_subtype_group_translations as unknown as { locale: string; name: string }[];
    for (const t of rawTrans) trans[t.locale] = t.name;

    return {
      id: g.id,
      slug: g.slug,
      sort_order: g.sort_order,
      is_active: g.is_active,
      translations: trans,
      items: itemsByGroup.get(g.id) ?? [],
    };
  });
}
