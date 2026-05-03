'use server';

import { createClient } from '@/lib/supabase/server';
import { signupCredentialsSchema, loginCredentialsSchema } from '../schemas';

type AuthResult = { data: { userId: string } } | { error: { message: string } };

export async function signupClient(input: unknown): Promise<AuthResult> {
  const parsed = signupCredentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { full_name, email, password, phone } = parsed.data;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });
  if (error || !data.user) {
    return { error: { message: error?.message ?? 'Signup failed' } };
  }

  // The handle_new_user trigger creates a profiles row automatically.
  // We update it with phone + ensure full_name is set.
  await supabase
    .from('profiles')
    .update({ full_name, phone, active_role: 'client' })
    .eq('id', data.user.id);

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
