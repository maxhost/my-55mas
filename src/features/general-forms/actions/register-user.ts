'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormSchema } from '@/shared/lib/forms/types';
import { extractMappedFields } from '@/shared/lib/forms/extract-mapped-fields';

type RegisterInput = {
  form_data: Record<string, unknown>;
  form_schema: FormSchema;
  locale: string;
  target_role: 'talent' | 'client';
  country_id?: string;
  city_id?: string;
};

/**
 * Registers a new user from form data.
 * Auth credentials come from db_column fields mapped to auth table.
 * The DB trigger `handle_new_user` creates profile + user_role automatically
 * based on the `role` metadata we pass to signUp.
 * We then UPDATE the profile with any additional mapped fields.
 * Passwords are never persisted in form_data.
 */
export async function registerUser(input: RegisterInput) {
  const { form_data, form_schema, locale, target_role, country_id, city_id } = input;

  console.log('[registerUser] START', { locale, target_role });
  console.log('[registerUser] form_data keys:', Object.keys(form_data));

  // 1. Extract all mapped fields (including auth)
  const mapped = extractMappedFields(form_schema, form_data);
  console.log('[registerUser] mapped tables:', Object.keys(mapped));
  console.log('[registerUser] mapped.profiles:', mapped.profiles);
  console.log('[registerUser] mapped.auth keys:', mapped.auth ? Object.keys(mapped.auth) : 'none');

  const email = mapped.auth?.email as string | undefined;
  const password = mapped.auth?.password as string | undefined;
  const confirmPassword = mapped.auth?.confirm_password as string | undefined;

  if (!email || !password) {
    console.log('[registerUser] FAIL: missing auth fields', { hasEmail: !!email, hasPassword: !!password });
    return { error: { _validation: ['Form must have auth.email and auth.password fields'] } };
  }

  if (confirmPassword !== undefined && confirmPassword !== password) {
    console.log('[registerUser] FAIL: passwords do not match');
    return { error: { _validation: ['Passwords do not match'] } };
  }

  const supabase = createClient();

  // 2. Create auth user — trigger creates profile + user_role with target_role
  console.log('[registerUser] signUp with role:', target_role);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { preferred_locale: locale, role: target_role } },
  });

  if (authError) {
    console.log('[registerUser] FAIL: signUp error:', authError.message);
    return { error: { _auth: [authError.message] } };
  }
  if (!authData.user) {
    console.log('[registerUser] FAIL: no user returned');
    return { error: { _auth: ['User creation failed'] } };
  }

  const userId = authData.user.id;
  console.log('[registerUser] signUp OK, userId:', userId);

  // 3. Build clean form_data (strip auth fields — never persist passwords)
  const allFields = form_schema.steps.flatMap((s) => s.fields);
  const authKeys = new Set(
    allFields
      .filter((f) => f.type === 'db_column' && f.db_table === 'auth')
      .map((f) => f.key),
  );
  const cleanData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(form_data)) {
    if (!authKeys.has(key)) {
      cleanData[key] = value;
    }
  }

  // 4. UPDATE profile with mapped fields (trigger already created the row)
  const profileUpdates = {
    preferred_locale: locale,
    ...mapped.profiles,
  };
  console.log('[registerUser] UPDATE profiles:', profileUpdates);
  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', userId);

  if (profileError) {
    console.log('[registerUser] FAIL: profile update error:', profileError.message);
    return { error: { _db: [profileError.message] } };
  }
  console.log('[registerUser] profiles UPDATE OK');

  // 5. Create talent_profile only for talent registrations
  if (target_role === 'talent') {
    const talentData = mapped.talent_profiles ?? {};
    console.log('[registerUser] INSERT talent_profiles:', talentData);
    const { error: talentError } = await supabase.from('talent_profiles').insert({
      user_id: userId,
      status: 'pending',
      ...(country_id && { country_id }),
      ...(city_id && { city_id }),
      ...talentData,
    });

    if (talentError) {
      console.log('[registerUser] FAIL: talent_profiles insert error:', talentError.message);
      return { error: { _db: [talentError.message] } };
    }
    console.log('[registerUser] talent_profiles INSERT OK');
  }

  // 6. Create client_profile only for client registrations
  if (target_role === 'client') {
    const clientData = mapped.client_profiles ?? {};
    console.log('[registerUser] INSERT client_profiles:', clientData);
    const { error: clientError } = await supabase.from('client_profiles').insert({
      user_id: userId,
      ...clientData,
    });

    if (clientError) {
      console.log('[registerUser] FAIL: client_profiles insert error:', clientError.message);
      return { error: { _db: [clientError.message] } };
    }
    console.log('[registerUser] client_profiles INSERT OK');
  }

  console.log('[registerUser] SUCCESS, userId:', userId);
  return { data: { user_id: userId, form_data: cleanData } };
}
