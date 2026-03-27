'use server';

import { createClient } from '@/lib/supabase/server';
import type { SubtypeGroupWithTranslations } from '../types';

/**
 * Lists all subtype groups for a service, with nested items and translations.
 * Returns groups sorted by sort_order, each with items sorted by sort_order.
 */
export async function listSubtypes(
  serviceId: string
): Promise<SubtypeGroupWithTranslations[]> {
  const supabase = createClient();

  // 1. Fetch groups with translations (JOIN)
  const { data: groups, error: groupsError } = await supabase
    .from('service_subtype_groups')
    .select('id, service_id, slug, sort_order, is_active, service_subtype_group_translations(locale, name)')
    .eq('service_id', serviceId)
    .order('sort_order', { ascending: true });

  if (groupsError) throw groupsError;
  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map((g) => g.id);

  // 2. Fetch all items for these groups with translations (JOIN)
  const { data: items, error: itemsError } = await supabase
    .from('service_subtypes')
    .select('id, group_id, slug, sort_order, is_active, service_subtype_translations(locale, name)')
    .in('group_id', groupIds)
    .order('sort_order', { ascending: true });

  if (itemsError) throw itemsError;

  // 3. Build items map grouped by group_id
  const itemsByGroup = new Map<string, SubtypeGroupWithTranslations['items']>();
  for (const item of items ?? []) {
    const trans: Record<string, string> = {};
    const rawTrans = item.service_subtype_translations as unknown as { locale: string; name: string }[];
    for (const t of rawTrans) {
      trans[t.locale] = t.name;
    }

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

  // 4. Assemble groups with translations + items
  return groups.map((g) => {
    const trans: Record<string, string> = {};
    const rawTrans = g.service_subtype_group_translations as unknown as { locale: string; name: string }[];
    for (const t of rawTrans) {
      trans[t.locale] = t.name;
    }

    return {
      id: g.id,
      service_id: g.service_id,
      slug: g.slug,
      sort_order: g.sort_order ?? 0,
      is_active: g.is_active,
      translations: trans,
      items: itemsByGroup.get(g.id) ?? [],
    };
  });
}
