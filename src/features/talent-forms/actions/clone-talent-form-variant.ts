'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { cloneFormVariantSchema } from '@/shared/lib/forms/schemas';
import type { FormWithTranslations } from '@/shared/lib/forms/types';
import { getTalentForm } from './get-talent-form';

type CloneInput = {
  service_id: string;
  source_city_id: string | null;
  target_city_id: string;
};

export async function cloneTalentFormVariant(
  input: CloneInput
): Promise<{ data?: FormWithTranslations; error?: string }> {
  const parsed = cloneFormVariantSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { service_id, source_city_id, target_city_id } = parsed.data;
  const supabase = createClient();

  const source = await getTalentForm(service_id, source_city_id, false);
  if (!source) {
    return { error: 'Source form not found' };
  }

  const { data: newForm, error: insertError } = await supabase
    .from('talent_forms')
    .insert({
      service_id,
      city_id: target_city_id,
      schema: source.schema,
    })
    .select('id')
    .single();

  if (insertError) throw insertError;

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
      .from('talent_form_translations')
      .insert(translationRows);

    if (transError) throw transError;
  }

  revalidatePath('/[locale]/(admin)/admin/talent-forms', 'layout');
  return { data: await getTalentForm(service_id, target_city_id, false) ?? undefined };
}
