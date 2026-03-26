'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  saveFormSchema,
  type SaveFormInput,
  saveFormTranslationsSchema,
  type SaveFormTranslationsInput,
  saveFormWithTranslationsSchema,
  type SaveFormWithTranslationsInput,
} from '../schemas';

export async function saveForm(input: SaveFormInput) {
  const parsed = saveFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { service_id, city_id, schema } = parsed.data;
  const supabase = createClient();

  // Check if a form already exists for this service+city
  let query = supabase
    .from('service_forms')
    .select('id, version')
    .eq('service_id', service_id)
    .eq('is_active', true)
    .limit(1);

  if (city_id) {
    query = query.eq('city_id', city_id);
  } else {
    query = query.is('city_id', null);
  }

  const { data: existing } = await query;

  if (existing && existing.length > 0) {
    // Update existing form, increment version
    const { error } = await supabase
      .from('service_forms')
      .update({
        schema,
        version: existing[0].version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing[0].id);

    if (error) return { error: { _db: [error.message] } };
    return { data: { id: existing[0].id } };
  }

  // Create new form
  const { data: newForm, error } = await supabase
    .from('service_forms')
    .insert({ service_id, city_id, schema })
    .select('id')
    .single();

  if (error) return { error: { _db: [error.message] } };
  return { data: { id: newForm.id } };
}

export async function saveFormTranslations(input: SaveFormTranslationsInput) {
  const parsed = saveFormTranslationsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { form_id, locale, labels, placeholders, option_labels } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase.from('service_form_translations').upsert(
    {
      form_id,
      locale,
      labels,
      placeholders,
      option_labels,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'form_id,locale' }
  );

  if (error) return { error: { _db: [error.message] } };
  return { data: { form_id, locale } };
}

export async function saveFormWithTranslations(
  input: SaveFormWithTranslationsInput
) {
  const parsed = saveFormWithTranslationsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { service_id, city_id, schema, locale, labels, placeholders, option_labels } =
    parsed.data;

  // Save schema (reuses existing saveForm logic)
  const formResult = await saveForm({ service_id, city_id, schema });
  if ('error' in formResult && formResult.error) return formResult;

  const formId = formResult.data!.id;

  // Save translations for the active locale
  const transResult = await saveFormTranslations({
    form_id: formId,
    locale,
    labels,
    placeholders,
    option_labels,
  });
  if ('error' in transResult && transResult.error) return transResult;

  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: { id: formId } };
}
