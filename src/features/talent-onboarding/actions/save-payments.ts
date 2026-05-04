'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { savePaymentsSchema } from '../schemas';
import type { Payments } from '../types';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Persists step 5 (Payments) into talent_profiles.
 * - has_social_security: boolean
 * - preferred_payment: enum (monthly_invoice/accumulate_credit)
 *
 * The talent_profiles row is identified by user_id (FK to auth.users).
 */
export async function savePayments(input: unknown): Promise<Result> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: { message: 'Not authenticated' } };

  const parsed = savePaymentsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const value: Payments = parsed.data;

  const { error } = await supabase
    .from('talent_profiles')
    .update({
      has_social_security: value.has_social_security,
      preferred_payment: value.preferred_payment,
    })
    .eq('user_id', auth.user.id);

  if (error) {
    return { error: { message: error.message } };
  }

  revalidatePath('/[locale]/(talent)/portal/onboarding', 'page');
  return { data: { ok: true } };
}
