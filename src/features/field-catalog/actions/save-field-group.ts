'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { fieldGroupInputSchema } from '../schemas';
import { CATALOG_LOCALES, type FieldGroupInput, type SaveFieldGroupResult } from '../types';

const UNIQUE_VIOLATION = '23505';

export async function saveFieldGroup(
  input: FieldGroupInput
): Promise<SaveFieldGroupResult> {
  console.log('[saveFieldGroup] input:', {
    id: input.id,
    slug: input.slug,
    sort_order: input.sort_order,
    is_active: input.is_active,
    translations_keys: Object.keys(input.translations ?? {}),
  });
  const parsed = fieldGroupInputSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    console.log('[saveFieldGroup] Zod FAIL:', msg);
    return { ok: false, error: msg };
  }
  const group = parsed.data;
  const supabase = createAdminClient();

  let id = group.id;
  if (id === null) {
    const { data, error } = await supabase
      .from('form_field_groups')
      .insert({
        slug: group.slug,
        sort_order: group.sort_order,
        is_active: group.is_active,
      })
      .select('id')
      .single();
    if (error) {
      console.log('[saveFieldGroup] insert FAIL:', error.code, error.message);
      if (error.code === UNIQUE_VIOLATION) return { ok: false, error: 'duplicateSlug' };
      return { ok: false, error: error.message };
    }
    id = data.id;
    console.log('[saveFieldGroup] insert OK, id:', id);
  } else {
    const { error } = await supabase
      .from('form_field_groups')
      .update({
        slug: group.slug,
        sort_order: group.sort_order,
        is_active: group.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) {
      console.log('[saveFieldGroup] update FAIL:', error.code, error.message);
      if (error.code === UNIQUE_VIOLATION) return { ok: false, error: 'duplicateSlug' };
      return { ok: false, error: error.message };
    }
  }

  const translationRows = CATALOG_LOCALES.map((locale) => ({
    group_id: id!,
    locale,
    name: group.translations[locale] || '',
  }));
  const { error: tErr } = await supabase
    .from('form_field_group_translations')
    .upsert(translationRows, { onConflict: 'group_id,locale' });
  if (tErr) {
    console.log('[saveFieldGroup] translations FAIL:', tErr.message);
    return { ok: false, error: tErr.message };
  }
  console.log('[saveFieldGroup] OK, id:', id);

  revalidatePath('/[locale]/(admin)/admin/field-catalog', 'layout');
  return { ok: true, data: { id: id! } };
}
