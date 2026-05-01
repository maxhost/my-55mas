'use server';

import { createClient } from '@/lib/supabase/server';
import type { SubtypeGroupWithTranslations } from '../types';

type I18nNameRecord = Record<string, { name?: string } | null> | null;

function flattenNames(i18n: I18nNameRecord): Record<string, string> {
  const out: Record<string, string> = {};
  if (!i18n) return out;
  for (const [locale, entry] of Object.entries(i18n)) {
    const n = entry?.name;
    if (typeof n === 'string') out[locale] = n;
  }
  return out;
}

export async function listAllSubtypes(): Promise<SubtypeGroupWithTranslations[]> {
  const supabase = createClient();

  const { data: groups, error: groupsError } = await supabase
    .from('service_subtype_groups')
    .select('id, slug, sort_order, is_active, i18n')
    .order('sort_order', { ascending: true });

  if (groupsError) throw groupsError;
  if (!groups || groups.length === 0) return [];

  const groupIds = groups.map((g) => g.id);

  const { data: items, error: itemsError } = await supabase
    .from('service_subtypes')
    .select('id, group_id, slug, sort_order, is_active, i18n')
    .in('group_id', groupIds)
    .order('sort_order', { ascending: true });

  if (itemsError) throw itemsError;

  const itemsByGroup = new Map<string, SubtypeGroupWithTranslations['items']>();
  for (const item of items ?? []) {
    if (!itemsByGroup.has(item.group_id)) itemsByGroup.set(item.group_id, []);
    itemsByGroup.get(item.group_id)!.push({
      id: item.id,
      group_id: item.group_id,
      slug: item.slug,
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active,
      translations: flattenNames(item.i18n as I18nNameRecord),
    });
  }

  return groups.map((g) => ({
    id: g.id,
    slug: g.slug,
    sort_order: g.sort_order,
    is_active: g.is_active,
    translations: flattenNames(g.i18n as I18nNameRecord),
    items: itemsByGroup.get(g.id) ?? [],
  }));
}
