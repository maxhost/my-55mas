'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/database.types';
import { fieldDefinitionInputSchema } from '../schemas';
import {
  CATALOG_LOCALES,
  type FieldDefinitionInput,
  type SaveFieldDefinitionResult,
} from '../types';

const UNIQUE_VIOLATION = '23505';

export async function saveFieldDefinition(
  input: FieldDefinitionInput
): Promise<SaveFieldDefinitionResult> {
  console.log('[saveFieldDefinition] input:', {
    id: input.id,
    group_id: input.group_id,
    key: input.key,
    input_type: input.input_type,
    persistence_type: input.persistence_type,
    persistence_target: input.persistence_target,
    options: input.options,
    sort_order: input.sort_order,
    is_active: input.is_active,
    translations_keys: Object.keys(input.translations ?? {}),
  });
  const parsed = fieldDefinitionInputSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    console.log('[saveFieldDefinition] Zod FAIL:', msg);
    return { ok: false, error: msg };
  }
  const def = parsed.data;
  const supabase = createAdminClient();

  const { data: group, error: gErr } = await supabase
    .from('form_field_groups')
    .select('id')
    .eq('id', def.group_id)
    .maybeSingle();
  if (gErr) {
    console.log('[saveFieldDefinition] group lookup FAIL:', gErr.message);
    return { ok: false, error: gErr.message };
  }
  if (!group) {
    console.log('[saveFieldDefinition] groupNotFound:', def.group_id);
    return { ok: false, error: 'groupNotFound' };
  }

  let id = def.id;
  const rowPayload = {
    group_id: def.group_id,
    key: def.key,
    input_type: def.input_type,
    persistence_type: def.persistence_type,
    persistence_target: def.persistence_target as Json,
    options: def.options as Json,
    options_source: def.options_source,
    config: (def.config ?? null) as Json,
    sort_order: def.sort_order,
    is_active: def.is_active,
  };

  if (id === null) {
    const { data, error } = await supabase
      .from('form_field_definitions')
      .insert(rowPayload)
      .select('id')
      .single();
    if (error) {
      console.log('[saveFieldDefinition] insert FAIL:', error.code, error.message);
      if (error.code === UNIQUE_VIOLATION) return { ok: false, error: 'duplicateKey' };
      return { ok: false, error: error.message };
    }
    id = data.id;
    console.log('[saveFieldDefinition] insert OK, id:', id);
  } else {
    const { error } = await supabase
      .from('form_field_definitions')
      .update({ ...rowPayload, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.log('[saveFieldDefinition] update FAIL:', error.code, error.message);
      if (error.code === UNIQUE_VIOLATION) return { ok: false, error: 'duplicateKey' };
      return { ok: false, error: error.message };
    }
  }

  const translationRows = CATALOG_LOCALES.map((locale) => {
    const t = def.translations[locale];
    return {
      field_id: id!,
      locale,
      label: t.label || '',
      placeholder: t.placeholder || null,
      description: t.description || null,
      option_labels: t.option_labels as Json,
    };
  });
  const { error: tErr } = await supabase
    .from('form_field_definition_translations')
    .upsert(translationRows, { onConflict: 'field_id,locale' });
  if (tErr) {
    console.log('[saveFieldDefinition] translations FAIL:', tErr.message);
    return { ok: false, error: tErr.message };
  }
  console.log('[saveFieldDefinition] OK, id:', id);

  revalidatePath('/[locale]/(admin)/admin/field-catalog', 'layout');
  return { ok: true, data: { id: id! } };
}
