'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/database.types';
import { validateCatalogFormSchema } from '@/shared/lib/field-catalog/catalog-schema-validation';
import type { CatalogFormSchema } from '@/shared/lib/field-catalog/schema-types';

type Input = {
  form_id: string;
  schema: CatalogFormSchema;
};

type Result = { ok: true } | { ok: false; error: string };

// Escribe un CatalogFormSchema directo en registration_forms.schema.
// No hace cascade a variants — el builder de catálogo v1 trabaja solo
// con la forma General/única.
export async function saveCatalogFormSchema(input: Input): Promise<Result> {
  console.log('[saveCatalogFormSchema] input:', {
    form_id: input.form_id,
    step_count: input.schema?.steps?.length,
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
  const { error } = await supabase
    .from('registration_forms')
    .update({
      schema: validation.data as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.form_id);
  if (error) {
    console.log('[saveCatalogFormSchema] update FAIL:', error.code, error.message);
    return { ok: false, error: error.message };
  }
  console.log('[saveCatalogFormSchema] OK');
  revalidatePath('/[locale]/(admin)/admin/forms', 'layout');
  return { ok: true };
}
