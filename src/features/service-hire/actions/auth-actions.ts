'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signupCredentialsSchema, loginCredentialsSchema } from '../schemas';
import { validateFiscalId, normalizeFiscalId } from '@/shared/fiscal/validators';

type AuthResult = { data: { userId: string } } | { error: { message: string } };

export async function signupClient(input: unknown): Promise<AuthResult> {
  const parsed = signupCredentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { full_name, email, password, phone, fiscal_id_type_id, fiscal_id } = parsed.data;
  const supabase = createClient();

  // Validate fiscal id format BEFORE creating the auth user so we don't leave
  // a partial signup state. Resolve the code via the fiscal_id_types catalog;
  // requires an active type. Anonymous (guest) sessions can read this table
  // via existing RLS policies, so the regular client is fine here.
  const { data: fiscalType, error: ftErr } = await supabase
    .from('fiscal_id_types')
    .select('code, is_active')
    .eq('id', fiscal_id_type_id)
    .maybeSingle();
  if (ftErr) return { error: { message: ftErr.message } };
  if (!fiscalType || !fiscalType.is_active) {
    return { error: { message: 'invalid_fiscal_id_type' } };
  }
  const fiscalRes = validateFiscalId(fiscal_id, fiscalType.code);
  if (!fiscalRes.ok) {
    return { error: { message: `fiscal_id_${fiscalRes.reason}` } };
  }
  const normalizedFiscalId = normalizeFiscalId(fiscal_id);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });
  if (error || !data.user) {
    return { error: { message: error?.message ?? 'Signup failed' } };
  }

  // The handle_new_user trigger creates a profiles row automatically.
  // We update it with phone + full_name + active_role=client. Auth user
  // creation succeeded so a partial-state recovery via admin would be
  // possible but is out of scope (best-effort propagation below).
  const admin = createAdminClient();
  const { error: profErr } = await admin
    .from('profiles')
    .update({ full_name, phone, active_role: 'client' })
    .eq('id', data.user.id);
  if (profErr) {
    return { error: { message: `Profile update failed: ${profErr.message}` } };
  }

  // Upsert client_profiles with fiscal data. user_id is UNIQUE so the upsert
  // is safe whether the row was created by some earlier flow or not.
  // terms_accepted is left to submit-service-hire which already requires it.
  const { error: cpErr } = await admin
    .from('client_profiles')
    .upsert(
      {
        user_id: data.user.id,
        fiscal_id_type_id,
        fiscal_id: normalizedFiscalId,
      },
      { onConflict: 'user_id' },
    );
  if (cpErr) {
    return { error: { message: `Client profile creation failed: ${cpErr.message}` } };
  }

  return { data: { userId: data.user.id } };
}

export async function loginClient(input: unknown): Promise<AuthResult> {
  const parsed = loginCredentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    return { error: { message: error?.message ?? 'Invalid credentials' } };
  }
  return { data: { userId: data.user.id } };
}

export async function signinAsGuest(): Promise<AuthResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    return { error: { message: error?.message ?? 'Anonymous sign-in failed' } };
  }
  return { data: { userId: data.user.id } };
}
