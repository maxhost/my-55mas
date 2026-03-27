'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveSubtypesSchema } from '../schemas';
import type { SaveSubtypesInput } from '../types';

/**
 * Saves all subtypes for a service (full replace strategy):
 * 1. Delete subtypes no longer in the list
 * 2. Upsert existing + new subtypes
 * 3. Upsert translations
 */
export async function saveSubtypes(input: SaveSubtypesInput) {
  const parsed = saveSubtypesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { service_id, subtypes } = parsed.data;
  const supabase = createClient();

  // 1. Get existing subtype IDs for this service
  const { data: existing } = await supabase
    .from('service_subtypes')
    .select('id')
    .eq('service_id', service_id);

  const existingIds = (existing ?? []).map((e) => e.id);
  const existingIdSet = new Set(existingIds);
  const incomingIds = subtypes.filter((s) => s.id).map((s) => s.id!);
  const incomingIdSet = new Set(incomingIds);

  // 2. Delete removed subtypes (CASCADE handles translations + talent_service_subtypes)
  const toDelete = existingIds.filter((id) => !incomingIdSet.has(id));
  if (toDelete.length > 0) {
    const { error: delError } = await supabase
      .from('service_subtypes')
      .delete()
      .in('id', toDelete);
    if (delError) return { error: { _db: [delError.message] } };
  }

  // 3. Upsert subtypes one by one (to handle both insert and update)
  for (const subtype of subtypes) {
    if (subtype.id && existingIdSet.has(subtype.id)) {
      // Update existing
      const { error } = await supabase
        .from('service_subtypes')
        .update({
          slug: subtype.slug,
          sort_order: subtype.sort_order,
          is_active: subtype.is_active,
        })
        .eq('id', subtype.id);
      if (error) return { error: { _db: [error.message] } };

      // Upsert translations
      for (const [locale, name] of Object.entries(subtype.translations)) {
        const { error: transError } = await supabase
          .from('service_subtype_translations')
          .upsert(
            { subtype_id: subtype.id, locale, name },
            { onConflict: 'subtype_id,locale' }
          );
        if (transError) return { error: { _db: [transError.message] } };
      }
    } else {
      // Insert new
      const { data: newSubtype, error } = await supabase
        .from('service_subtypes')
        .insert({
          service_id,
          slug: subtype.slug,
          sort_order: subtype.sort_order,
          is_active: subtype.is_active,
        })
        .select('id')
        .single();
      if (error) return { error: { _db: [error.message] } };

      // Insert translations
      const transRows = Object.entries(subtype.translations).map(
        ([locale, name]) => ({
          subtype_id: newSubtype.id,
          locale,
          name,
        })
      );
      if (transRows.length > 0) {
        const { error: transError } = await supabase
          .from('service_subtype_translations')
          .insert(transRows);
        if (transError) return { error: { _db: [transError.message] } };
      }
    }
  }

  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: { service_id } };
}
