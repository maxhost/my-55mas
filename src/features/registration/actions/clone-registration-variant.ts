'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { RegistrationFormWithTranslations } from '../types';
import { getRegistrationForm } from './get-registration-form';

type CloneInput = {
  slug: string;
  source_city_id: string | null;
  target_city_id: string;
};

/**
 * Clones a registration form variant (usually General → city).
 * Creates new form row with parent_id pointing to the General.
 */
export async function cloneRegistrationVariant(
  input: CloneInput
): Promise<{ data?: RegistrationFormWithTranslations; error?: string }> {
  const { slug, source_city_id, target_city_id } = input;
  const supabase = createClient();

  const source = await getRegistrationForm(slug, source_city_id, false);
  if (!source) return { error: 'Source form not found' };

  // Find the General form to use as parent_id
  const generalId = source.parent_id ?? source.id;

  const { data: newForm, error: insertError } = await supabase
    .from('registration_forms')
    .insert({
      slug,
      name: source.name,
      city_id: target_city_id,
      parent_id: generalId,
      schema: JSON.parse(JSON.stringify(source.schema)),
    })
    .select('id')
    .single();

  if (insertError) throw insertError;

  // Copy translations
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
      .from('registration_form_translations')
      .insert(translationRows);

    if (transError) throw transError;
  }

  revalidatePath('/[locale]/(admin)/admin/talent-registration', 'layout');
  return { data: await getRegistrationForm(slug, target_city_id, false) ?? undefined };
}
