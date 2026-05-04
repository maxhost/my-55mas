'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { savePersonalDataSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Step 1 of the talent onboarding wizard.
 * Persists `gender` and `birth_date` to `profiles` for the authenticated user.
 */
export async function savePersonalData(input: unknown): Promise<Result> {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { error: { message: 'Not authenticated' } };
  }

  const parsed = savePersonalDataSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' },
    };
  }

  const { gender, birth_date } = parsed.data;

  const { error } = await supabase
    .from('profiles')
    .update({ gender, birth_date })
    .eq('id', auth.user.id);

  if (error) {
    return { error: { message: error.message } };
  }

  revalidatePath('/[locale]/(talent)/portal/onboarding', 'page');
  return { data: { ok: true } };
}
