'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { extractMappedFields } from '@/shared/lib/forms/extract-mapped-fields';

import type { FormSchema } from '@/shared/lib/forms/types';

type SubmitInput = {
  talent_id: string;
  service_id: string;
  country_id: string;
  form_id: string;
  form_data: Record<string, unknown>;
  form_schema: FormSchema;
  subtype_ids: string[];
};

/**
 * Saves a talent's completed form:
 * 1. Updates talent_services.form_data + form_id
 * 2. Syncs talent_service_subtypes (delete old + insert new)
 */
export async function submitTalentService(input: SubmitInput) {
  const { talent_id, service_id, country_id, form_id, form_data, form_schema, subtype_ids } = input;
  const supabase = createClient();

  // 1. Update talent_services with form data
  const { error: updateError } = await supabase
    .from('talent_services')
    .update({
      form_data: form_data as unknown as Json,
      form_id,
    })
    .eq('talent_id', talent_id)
    .eq('service_id', service_id)
    .eq('country_id', country_id);

  if (updateError) return { error: { _db: [updateError.message] } };

  // 2. Extract db_column mapped fields and update talent_profiles if any
  const mapped = extractMappedFields(form_schema, form_data);
  const tpData = mapped.talent_profiles;
  if (tpData && Object.keys(tpData).length > 0) {
    const { error: tpError } = await supabase
      .from('talent_profiles')
      .update(tpData)
      .eq('user_id', talent_id);

    if (tpError) return { error: { _db: [tpError.message] } };
  }

  // 3. Sync subtypes: delete existing + insert new
  const { error: deleteError } = await supabase
    .from('talent_service_subtypes')
    .delete()
    .eq('talent_id', talent_id);

  if (deleteError) return { error: { _db: [deleteError.message] } };

  if (subtype_ids.length > 0) {
    const rows = subtype_ids.map((subtype_id) => ({
      talent_id,
      subtype_id,
    }));

    const { error: insertError } = await supabase
      .from('talent_service_subtypes')
      .insert(rows);

    if (insertError) return { error: { _db: [insertError.message] } };
  }

  revalidatePath('/[locale]/(talent)/portal', 'layout');
  return { data: { talent_id, service_id } };
}
