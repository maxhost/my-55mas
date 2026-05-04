'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Final step of the talent onboarding wizard.
 * Stamps `talent_profiles.onboarding_completed_at = now()` for the authenticated
 * user.
 *
 * IMPORTANT: this does NOT touch `talent_profiles.status`. Status remains
 * 'pending' until an admin reviews and approves the talent. Onboarding
 * completion and admin approval are independent gates.
 */
export async function completeOnboarding(): Promise<Result> {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: { message: 'Not authenticated' } };

  const { error } = await supabase
    .from('talent_profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('user_id', auth.user.id);

  if (error) return { error: { message: error.message } };

  revalidatePath('/[locale]/(talent)/portal/onboarding', 'page');
  return { data: { ok: true } };
}
