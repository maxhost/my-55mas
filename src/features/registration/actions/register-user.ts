'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormSchema } from '@/shared/lib/forms/types';

type RegisterInput = {
  form_data: Record<string, unknown>;
  form_schema: FormSchema;
  locale: string;
};

/**
 * Registers a new talent user from form data.
 * Extracts email/password by field type, creates auth user + profile.
 * Password is never persisted in form_data.
 */
export async function registerUser(input: RegisterInput) {
  const { form_data, form_schema, locale } = input;

  // Find email and password fields by type
  const allFields = form_schema.steps.flatMap((s) => s.fields);
  const emailField = allFields.find((f) => f.type === 'email');
  const passwordField = allFields.find((f) => f.type === 'password');

  if (!emailField || !passwordField) {
    return { error: { _validation: ['Form must have email and password fields'] } };
  }

  const email = form_data[emailField.key] as string | undefined;
  const password = form_data[passwordField.key] as string | undefined;

  if (!email || !password) {
    return { error: { _validation: ['Email and password are required'] } };
  }

  const supabase = createClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { preferred_locale: locale } },
  });

  if (authError) return { error: { _auth: [authError.message] } };
  if (!authData.user) return { error: { _auth: ['User creation failed'] } };

  const userId = authData.user.id;

  // 2. Build clean form_data (strip password fields)
  const cleanData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(form_data)) {
    const field = allFields.find((f) => f.key === key);
    if (field && field.type !== 'password') {
      cleanData[key] = value;
    }
  }

  // 3. Create profile
  const fullName = (form_data['full_name'] ?? form_data['nombre'] ?? '') as string;
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    email,
    full_name: fullName || null,
    active_role: 'talent',
    preferred_locale: locale,
  });

  if (profileError) return { error: { _db: [profileError.message] } };

  // 4. Create talent_profile (minimal — birth_date required, use placeholder)
  const birthDate = (form_data['birth_date'] ?? form_data['fecha_nacimiento'] ?? '1970-01-01') as string;
  const { error: talentError } = await supabase.from('talent_profiles').insert({
    user_id: userId,
    birth_date: birthDate,
    status: 'pending',
  });

  if (talentError) return { error: { _db: [talentError.message] } };

  return { data: { user_id: userId, form_data: cleanData } };
}
