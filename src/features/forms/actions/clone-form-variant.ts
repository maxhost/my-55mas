'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { cloneFormVariantSchema } from '../schemas';
import type { FormWithTranslations } from '../types';
import { getForm } from './get-form';

type CloneInput = {
  service_id: string;
  source_city_id: string | null;
  target_city_id: string;
};

export async function cloneFormVariant(
  input: CloneInput
): Promise<{ data?: FormWithTranslations; error?: string }> {
  const parsed = cloneFormVariantSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { service_id, source_city_id, target_city_id } = parsed.data;
  const supabase = createClient();

  // Load source form (no fallback — must exist exactly)
  const source = await getForm(service_id, source_city_id, false);
  if (!source) {
    return { error: 'Source form not found' };
  }

  // Create new form for the target city
  const { data: newForm, error: insertError } = await supabase
    .from('service_forms')
    .insert({
      service_id,
      city_id: target_city_id,
      schema: source.schema,
    })
    .select('id')
    .single();

  if (insertError) throw insertError;

  // Clone all translations
  const locales = Object.keys(source.translations);
  if (locales.length > 0) {
    const translationRows = locales.map((locale) => ({
      form_id: newForm.id,
      locale,
      labels: source.translations[locale].labels,
      placeholders: source.translations[locale].placeholders,
      option_labels: source.translations[locale].option_labels,
    }));

    const { error: transError } = await supabase
      .from('service_form_translations')
      .insert(translationRows);

    if (transError) throw transError;
  }

  // Return the new form with translations
  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: await getForm(service_id, target_city_id, false) ?? undefined };
}
