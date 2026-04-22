'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/database.types';
import { validateCatalogFormSchema } from '@/shared/lib/field-catalog/catalog-schema-validation';
import type { CatalogFormSchema } from '@/shared/lib/field-catalog/schema-types';

type LocaleTranslations = {
  labels: Record<string, string>;
  placeholders: Record<string, string>;
  option_labels: Record<string, string>;
};

type Input = {
  form_id: string;
  schema: CatalogFormSchema;
  translations: Record<string, LocaleTranslations>;
};

type Result = { ok: true } | { ok: false; error: string };

// Escribe CatalogFormSchema en registration_forms.schema + upserta las 5
// filas de registration_form_translations (una por locale). Step/action
// labels van en labels[key]; placeholders y option_labels quedan vacíos
// porque ese metadata vive en el catálogo (form_field_definition_translations).
export async function saveCatalogFormSchema(input: Input): Promise<Result> {
  console.log('[saveCatalogFormSchema] input:', {
    form_id: input.form_id,
    step_count: input.schema?.steps?.length,
    locales: Object.keys(input.translations ?? {}),
  });

  const validation = validateCatalogFormSchema(input.schema);
  if (!validation.ok) {
    const msg = validation.errors.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    console.log('[saveCatalogFormSchema] Zod FAIL:', msg);
    return { ok: false, error: msg };
  }

  const supabase = createAdminClient();

  const { error: schemaErr } = await supabase
    .from('registration_forms')
    .update({
      schema: validation.data as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.form_id);
  if (schemaErr) {
    console.log('[saveCatalogFormSchema] schema update FAIL:', schemaErr.code, schemaErr.message);
    return { ok: false, error: schemaErr.message };
  }

  const translationRows = Object.entries(input.translations).map(
    ([locale, t]) => ({
      form_id: input.form_id,
      locale,
      labels: (t.labels ?? {}) as Json,
      placeholders: (t.placeholders ?? {}) as Json,
      option_labels: (t.option_labels ?? {}) as Json,
    })
  );

  if (translationRows.length > 0) {
    const { error: tErr } = await supabase
      .from('registration_form_translations')
      .upsert(translationRows, { onConflict: 'form_id,locale' });
    if (tErr) {
      console.log('[saveCatalogFormSchema] translations FAIL:', tErr.message);
      return { ok: false, error: tErr.message };
    }
  }

  console.log('[saveCatalogFormSchema] OK');
  revalidatePath('/[locale]/(admin)/admin/forms', 'layout');
  return { ok: true };
}
