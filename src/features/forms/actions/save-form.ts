'use server';

import { createClient } from '@/lib/supabase/server';
import {
  saveFormSchema,
  type SaveFormInput,
  saveFormTranslationsSchema,
  type SaveFormTranslationsInput,
} from '../schemas';

export async function saveForm(input: SaveFormInput) {
  const parsed = saveFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { service_id, country_id, schema } = parsed.data;
  const supabase = createClient();

  // Check if a form already exists for this service+country
  let query = supabase
    .from('service_forms')
    .select('id, version')
    .eq('service_id', service_id)
    .eq('is_active', true)
    .limit(1);

  if (country_id) {
    query = query.eq('country_id', country_id);
  } else {
    query = query.is('country_id', null);
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

    if (error) throw error;
    return { data: { id: existing[0].id } };
  }

  // Create new form
  const { data: newForm, error } = await supabase
    .from('service_forms')
    .insert({ service_id, country_id, schema })
    .select('id')
    .single();

  if (error) throw error;
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

  if (error) throw error;
  return { data: { form_id, locale } };
}
