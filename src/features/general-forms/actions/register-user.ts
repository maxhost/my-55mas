'use server';

import { createClient } from '@/lib/supabase/server';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';
import { persistFormData } from '@/shared/lib/field-catalog/persist-form-data';

type RegisterInput = {
  form_data: Record<string, unknown>;
  resolved_form: ResolvedForm;
  locale: string;
  target_role: 'talent' | 'client';
  country_id?: string;
  city_id?: string;
};

// Registra un nuevo usuario desde form_data + ResolvedForm.
// Flujo de 3 fases:
// 1. Auth (signUp) → userId nuevo. Trigger handle_new_user crea profile.
// 2. INSERT talent_profiles / client_profiles con metadata de contexto.
// 3. Persistir resto de fields (db_column, form_response, survey, etc.)
//    con el userId recién creado.
export async function registerUser(input: RegisterInput) {
  const { form_data, resolved_form, locale, target_role, country_id, city_id } =
    input;
  const supabase = createClient();

  const allFields = resolved_form.steps.flatMap((s) => s.fields);
  const authFields = allFields.filter((f) => f.persistence_type === 'auth');
  const nonAuthFields = allFields.filter((f) => f.persistence_type !== 'auth');

  // Phase 1 — signUp
  const authResult = await persistFormData({
    supabase,
    userId: null,
    fields: authFields,
    formData: form_data,
    context: {
      authSignUpOptions: {
        data: { preferred_locale: locale, role: target_role },
      },
    },
  });
  if (!authResult.ok) {
    return { error: { _auth: authResult.errors.map((e) => e.message) } };
  }
  const userId = authResult.userId;

  // Phase 2 — INSERT role-specific row
  if (target_role === 'talent') {
    const { error } = await supabase.from('talent_profiles').insert({
      user_id: userId,
      status: 'pending',
      ...(country_id && { country_id }),
      ...(city_id && { city_id }),
    });
    if (error) return { error: { _db: [error.message] } };
  } else if (target_role === 'client') {
    const { error } = await supabase
      .from('client_profiles')
      .insert({ user_id: userId });
    if (error) return { error: { _db: [error.message] } };
  }

  // Also ensure preferred_locale on profile (handle_new_user may not set it).
  await supabase
    .from('profiles')
    .update({ preferred_locale: locale })
    .eq('id', userId);

  // Phase 3 — persist remaining fields (db_column, form_response, survey, etc.)
  const rest = await persistFormData({
    supabase,
    userId,
    fields: nonAuthFields,
    formData: form_data,
  });
  if (!rest.ok) {
    return { error: { _db: rest.errors.map((e) => e.message) } };
  }

  return { data: { user_id: userId } };
}
