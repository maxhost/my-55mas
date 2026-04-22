'use server';

import { createClient } from '@/lib/supabase/server';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';
import { persistFormData } from '@/shared/lib/field-catalog/persist-form-data';

type SaveStepInput = {
  form_data: Record<string, unknown>;
  resolved_form: ResolvedForm;
  target_role: 'talent' | 'client';
};

// Persiste fields de un step post-registration (el user ya existe).
// Auth fields se ignoran acá — se crearon en registerUser. Si hay
// service_select fields, el adapter requiere country_id; lo resolvemos
// desde talent_profiles para el user autenticado.
export async function saveRegistrationStep(input: SaveStepInput) {
  const { form_data, resolved_form, target_role } = input;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _auth: ['User not authenticated'] } };

  const allFields = resolved_form.steps.flatMap((s) => s.fields);
  const nonAuthFields = allFields.filter((f) => f.persistence_type !== 'auth');
  const needsServiceSelect = nonAuthFields.some(
    (f) => f.persistence_type === 'service_select'
  );

  let serviceSelectCountryId: string | null = null;
  if (needsServiceSelect && target_role === 'talent') {
    const { data: tp } = await supabase
      .from('talent_profiles')
      .select('country_id')
      .eq('user_id', user.id)
      .maybeSingle();
    serviceSelectCountryId = tp?.country_id ?? null;
  }

  const result = await persistFormData({
    supabase,
    userId: user.id,
    fields: nonAuthFields,
    formData: form_data,
    context: serviceSelectCountryId
      ? { serviceSelect: { country_id: serviceSelectCountryId } }
      : undefined,
  });
  if (!result.ok) {
    return { error: { _db: result.errors.map((e) => e.message) } };
  }

  return { data: { user_id: user.id } };
}
