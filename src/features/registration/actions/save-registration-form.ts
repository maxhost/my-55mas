'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveRegistrationFormSchema } from '../schemas';
import type { SaveRegistrationFormInput } from '../types';

// ── Save schema only ─────────────────────────────────

type SaveSchemaInput = {
  slug: string;
  city_id: string | null;
  schema: SaveRegistrationFormInput['schema'];
};

export async function saveRegistrationForm(input: SaveSchemaInput) {
  const supabase = createClient();

  // Find existing form by slug + city_id
  let query = supabase
    .from('registration_forms')
    .select('id, version')
    .eq('slug', input.slug);

  if (input.city_id) {
    query = query.eq('city_id', input.city_id);
  } else {
    query = query.is('city_id', null);
  }

  const { data: existing } = await query.single();
  if (!existing) return { error: { _db: ['Form not found'] } };

  const { error } = await supabase
    .from('registration_forms')
    .update({
      schema: JSON.parse(JSON.stringify(input.schema)),
      version: existing.version + 1,
    })
    .eq('id', existing.id);

  if (error) return { error: { _db: [error.message] } };
  return { data: { id: existing.id } };
}

// ── Save translations only ───────────────────────────

type SaveTransInput = {
  form_id: string;
  locale: string;
  labels: Record<string, string>;
  placeholders: Record<string, string>;
  option_labels: Record<string, string>;
};

export async function saveRegistrationFormTranslations(input: SaveTransInput) {
  const supabase = createClient();

  const { error } = await supabase
    .from('registration_form_translations')
    .upsert(
      {
        form_id: input.form_id,
        locale: input.locale,
        labels: input.labels,
        placeholders: input.placeholders,
        option_labels: input.option_labels,
      },
      { onConflict: 'form_id,locale' }
    );

  if (error) return { error: { _db: [error.message] } };
  return { data: { form_id: input.form_id } };
}

// ── Save schema + translations (combined) ────────────

export async function saveRegistrationFormWithTranslations(
  input: SaveRegistrationFormInput
) {
  const parsed = saveRegistrationFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { slug, city_id, schema, locale, labels, placeholders, option_labels } = parsed.data;

  const formResult = await saveRegistrationForm({ slug, city_id, schema });
  if ('error' in formResult && formResult.error) return formResult;

  const formId = formResult.data!.id;
  const transResult = await saveRegistrationFormTranslations({
    form_id: formId,
    locale,
    labels,
    placeholders,
    option_labels,
  });
  if ('error' in transResult && transResult.error) return transResult;

  revalidatePath('/[locale]/(admin)/admin/talent-registration', 'layout');
  return { data: { id: formId } };
}
