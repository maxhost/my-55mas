'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveSubtypeGroupsSchema } from '../schemas';
import type { SaveSubtypeGroupsInput, SubtypeGroupInput } from '../types';

/**
 * Saves all subtype groups + items globally (full replace strategy):
 * 1. Delete groups no longer in the list (CASCADE handles items + translations)
 * 2. Upsert groups: update existing, insert new
 * 3. For each group: upsert items + translations
 */
export async function saveSubtypes(input: SaveSubtypeGroupsInput) {
  const parsed = saveSubtypeGroupsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { groups } = parsed.data;
  const supabase = createClient();

  // 1. Get all existing group IDs
  const { data: existing } = await supabase
    .from('service_subtype_groups')
    .select('id');

  const existingIds = (existing ?? []).map((e) => e.id);
  const incomingIds = groups.filter((g) => g.id).map((g) => g.id!);
  const incomingIdSet = new Set(incomingIds);

  // 2. Delete removed groups (CASCADE deletes items + all translations)
  const toDelete = existingIds.filter((id) => !incomingIdSet.has(id));
  if (toDelete.length > 0) {
    const { error: delError } = await supabase
      .from('service_subtype_groups')
      .delete()
      .in('id', toDelete);
    if (delError) return { error: { _db: [delError.message] } };
  }

  // 3. Upsert each group + its items
  for (const group of groups) {
    const result = await upsertGroup(supabase, group);
    if (result?.error) return result;
  }

  revalidatePath('/[locale]/(admin)/admin/subtypes', 'layout');
  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: { success: true } };
}

async function upsertGroup(
  supabase: ReturnType<typeof createClient>,
  group: SubtypeGroupInput
) {
  let groupId: string;

  // Build i18n jsonb from translations record { locale: name }
  const groupI18n = Object.fromEntries(
    Object.entries(group.translations).map(([locale, name]) => [locale, { name }])
  ) as unknown as Json;

  if (group.id) {
    const { error } = await supabase
      .from('service_subtype_groups')
      .update({
        slug: group.slug,
        sort_order: group.sort_order,
        is_active: group.is_active,
        i18n: groupI18n,
      })
      .eq('id', group.id);
    if (error) return { error: { _db: [error.message] } };
    groupId = group.id;
  } else {
    const { data, error } = await supabase
      .from('service_subtype_groups')
      .insert({
        slug: group.slug,
        sort_order: group.sort_order,
        is_active: group.is_active,
        i18n: groupI18n,
      })
      .select('id')
      .single();
    if (error) return { error: { _db: [error.message] } };
    groupId = data.id;
  }

  return upsertItems(supabase, groupId, group.items);
}

async function upsertItems(
  supabase: ReturnType<typeof createClient>,
  groupId: string,
  items: SubtypeGroupInput['items']
) {
  // Get existing item IDs for this group
  const { data: existingItems } = await supabase
    .from('service_subtypes')
    .select('id')
    .eq('group_id', groupId);

  const existingIds = (existingItems ?? []).map((e) => e.id);
  const incomingIds = items.filter((i) => i.id).map((i) => i.id!);
  const incomingIdSet = new Set(incomingIds);

  // Delete removed items (CASCADE handles talent_service_subtypes)
  const toDelete = existingIds.filter((id) => !incomingIdSet.has(id));
  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('service_subtypes')
      .delete()
      .in('id', toDelete);
    if (error) return { error: { _db: [error.message] } };
  }

  for (const item of items) {
    const itemI18n = Object.fromEntries(
      Object.entries(item.translations).map(([locale, name]) => [locale, { name }])
    ) as unknown as Json;

    if (item.id && existingIds.includes(item.id)) {
      const { error } = await supabase
        .from('service_subtypes')
        .update({
          slug: item.slug,
          sort_order: item.sort_order,
          is_active: item.is_active,
          i18n: itemI18n,
        })
        .eq('id', item.id);
      if (error) return { error: { _db: [error.message] } };
    } else {
      const { error } = await supabase
        .from('service_subtypes')
        .insert({
          group_id: groupId,
          slug: item.slug,
          sort_order: item.sort_order,
          is_active: item.is_active,
          i18n: itemI18n,
        })
        .select('id')
        .single();
      if (error) return { error: { _db: [error.message] } };
    }
  }
}
