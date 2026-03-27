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
} from '@/shared/lib/forms/schemas';

export async function saveTalentForm(input: SaveFormInput) {
  const parsed = saveFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { service_id, city_id, schema } = parsed.data;
  const supabase = createClient();

  let query = supabase
    .from('talent_forms')
    .select('id, version')
    .eq('service_id', service_id)
    .limit(1);

  if (city_id) {
    query = query.eq('city_id', city_id);
  } else {
    query = query.is('city_id', null);
  }

  const { data: existing } = await query;

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from('talent_forms')
      .update({
        schema,
        version: existing[0].version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing[0].id);

    if (error) return { error: { _db: [error.message] } };
    return { data: { id: existing[0].id } };
  }

  const { data: newForm, error } = await supabase
    .from('talent_forms')
    .insert({ service_id, city_id, schema })
    .select('id')
    .single();

  if (error) return { error: { _db: [error.message] } };
  return { data: { id: newForm.id } };
}

export async function saveTalentFormTranslations(input: SaveFormTranslationsInput) {
  const parsed = saveFormTranslationsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { form_id, locale, labels, placeholders, option_labels } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase.from('talent_form_translations').upsert(
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

export async function saveTalentFormWithTranslations(
  input: SaveFormWithTranslationsInput
) {
  const parsed = saveFormWithTranslationsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { service_id, city_id, schema, locale, labels, placeholders, option_labels } =
    parsed.data;

  const formResult = await saveTalentForm({ service_id, city_id, schema });
  if ('error' in formResult && formResult.error) return formResult;

  const formId = formResult.data!.id;

  const transResult = await saveTalentFormTranslations({
    form_id: formId,
    locale,
    labels,
    placeholders,
    option_labels,
  });
  if ('error' in transResult && transResult.error) return transResult;

  revalidatePath('/[locale]/(admin)/admin/talent-forms', 'layout');
  return { data: { id: formId } };
}
