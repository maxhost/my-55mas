'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveContactAddressSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Step 2 of the talent onboarding wizard.
 * Persists `preferred_contact`, `address` (jsonb) and `preferred_city` to
 * `profiles` for the authenticated user.
 *
 * NOTE: `preferred_country` is NOT modified — country is read-only in the
 * wizard and locked to whatever was set during registration.
 */
export async function saveContactAddress(input: unknown): Promise<Result> {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { error: { message: 'Not authenticated' } };
  }

  const parsed = saveContactAddressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' },
    };
  }

  const { preferred_contact, address, city_id } = parsed.data;

  const { error } = await supabase
    .from('profiles')
    .update({
      preferred_contact,
      address: address as unknown as Json,
      preferred_city: city_id,
    })
    .eq('id', auth.user.id);

  if (error) {
    return { error: { message: error.message } };
  }

  revalidatePath('/[locale]/(talent)/portal/onboarding', 'page');
  return { data: { ok: true } };
}
