'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveActivationSchema } from '../schemas';
import type { SaveActivationInput } from '../types';

type Result = { data: { id: string } } | { error: Record<string, string[]> };

export async function saveFormDefinitionActivation(input: SaveActivationInput): Promise<Result> {
  const parsed = saveActivationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { formId, is_active, countryIds } = parsed.data;
  const supabase = createClient();

  const { error: updateError } = await supabase
    .from('form_definitions')
    .update({ is_active })
    .eq('id', formId);

  if (updateError) return { error: { _db: [updateError.message] } };

  const { error: deleteError } = await supabase
    .from('form_definition_countries')
    .delete()
    .eq('form_id', formId);

  if (deleteError) return { error: { _db: [deleteError.message] } };

  if (countryIds.length > 0) {
    const rows = countryIds.map((country_id) => ({
      form_id: formId,
      country_id,
      is_active: true,
    }));
    const { error: insertError } = await supabase
      .from('form_definition_countries')
      .insert(rows);

    if (insertError) return { error: { _db: [insertError.message] } };
  }

  revalidatePath('/[locale]/(admin)/admin/form-definitions', 'layout');
  return { data: { id: formId } };
}
