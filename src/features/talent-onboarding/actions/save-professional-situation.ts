'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveProfessionalSituationSchema } from '../schemas';
import type { ProfessionalSituation } from '../types';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Persists step 3 (Professional Situation) into talent_profiles.
 * - professional_status: enum (pre_retired/unemployed/employed/retired)
 * - previous_experience: free-text or null
 *
 * The talent_profiles row is identified by user_id (FK to auth.users).
 */
export async function saveProfessionalSituation(input: unknown): Promise<Result> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: { message: 'Not authenticated' } };

  const parsed = saveProfessionalSituationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const value: ProfessionalSituation = parsed.data;

  const { error } = await supabase
    .from('talent_profiles')
    .update({
      professional_status: value.professional_status,
      previous_experience: value.previous_experience,
    })
    .eq('user_id', auth.user.id);

  if (error) {
    return { error: { message: error.message } };
  }

  revalidatePath('/[locale]/(talent)/portal/onboarding', 'page');
  return { data: { ok: true } };
}
