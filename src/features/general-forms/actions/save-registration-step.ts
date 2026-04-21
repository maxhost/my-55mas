'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormSchema } from '@/shared/lib/forms/types';
import { extractMappedFields } from '@/shared/lib/forms/extract-mapped-fields';

type SaveStepInput = {
  form_data: Record<string, unknown>;
  form_schema: FormSchema;
  target_role: 'talent' | 'client';
};

/**
 * Persists form data from post-registration wizard steps.
 * Uses extractMappedFields to update profiles/talent_profiles/client_profiles.
 * Handles service_select fields by creating talent_services records.
 */
export async function saveRegistrationStep(input: SaveStepInput) {
  const { form_data, form_schema, target_role } = input;
  const supabase = createClient();

  // 1. Get authenticated user (registered in a previous step)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: { _auth: ['User not authenticated'] } };

  // 2. Extract db_column mapped fields (auth fields are ignored — already handled)
  const mapped = extractMappedFields(form_schema, form_data);

  // 3. Update profiles
  if (mapped.profiles && Object.keys(mapped.profiles).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update(mapped.profiles)
      .eq('id', user.id);
    if (error) return { error: { _db: [error.message] } };
  }

  // 4. Update talent_profiles + handle service_select
  if (target_role === 'talent') {
    const tpData = mapped.talent_profiles ?? {};
    if (Object.keys(tpData).length > 0) {
      const { error } = await supabase
        .from('talent_profiles')
        .update(tpData)
        .eq('user_id', user.id);
      if (error) return { error: { _db: [error.message] } };
    }
    await syncServiceSelections(supabase, user.id, form_schema, form_data);
  }

  // 5. Update client_profiles
  if (target_role === 'client') {
    const cpData = mapped.client_profiles ?? {};
    if (Object.keys(cpData).length > 0) {
      const { error } = await supabase
        .from('client_profiles')
        .update(cpData)
        .eq('user_id', user.id);
      if (error) return { error: { _db: [error.message] } };
    }
  }

  return { data: { user_id: user.id } };
}

// ── Helper: sync service_select fields → talent_services ──

async function syncServiceSelections(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  schema: FormSchema,
  formData: Record<string, unknown>,
) {
  const serviceFields = schema.steps
    .flatMap((s) => s.fields)
    .filter((f) => f.type === 'service_select');
  if (serviceFields.length === 0) return;

  const serviceIds: string[] = [];
  for (const field of serviceFields) {
    const val = formData[field.key];
    if (Array.isArray(val)) serviceIds.push(...val);
  }
  if (serviceIds.length === 0) return;

  const { data: tp } = await supabase
    .from('talent_profiles')
    .select('id, country_id')
    .eq('user_id', userId)
    .single();
  if (!tp?.country_id) return;

  const rows = serviceIds.map((sid) => ({
    talent_id: tp.id,
    service_id: sid,
    country_id: tp.country_id!,
  }));

  await supabase
    .from('talent_services')
    .upsert(rows, { onConflict: 'talent_id,service_id,country_id' });
}
