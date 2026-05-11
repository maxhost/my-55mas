'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const inputSchema = z.object({ email: z.string().email().max(200) });

type Result = { data: { hasAccount: boolean } } | { error: { message: string } };

/**
 * Returns whether the given email is registered to a non-anonymous account.
 * Used by the guest flow to block re-use of an account email (decision B1).
 *
 * Implementation uses the public.is_email_registered RPC, which runs with
 * SECURITY DEFINER to read auth.users. The function returns only a boolean
 * to bound information leakage (no user_id, no timestamps). Same enumeration
 * surface as Supabase Auth's signUp "User already registered" error.
 */
export async function checkEmailStatus(input: unknown): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid email' } };
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc('is_email_registered', {
    p_email: parsed.data.email,
  });
  if (error) {
    return { error: { message: error.message } };
  }
  return { data: { hasAccount: Boolean(data) } };
}
