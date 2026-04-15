'use server';

import { revalidatePath } from 'next/cache';
// TODO: swap to createClient() when RLS hardening lands project-wide.
import { createAdminClient } from '@/lib/supabase/admin';
import { spokenLanguageCodeSchema } from '../schemas';
import type { DeleteSpokenLanguageResult } from '../types';

export async function deleteSpokenLanguage(
  code: string
): Promise<DeleteSpokenLanguageResult> {
  const parsed = spokenLanguageCodeSchema.safeParse(code);
  if (!parsed.success) return { error: { code: ['invalidCode'] } };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('spoken_languages')
    .update({ is_active: false })
    .eq('code', parsed.data);

  if (error) return { error: { _db: [error.message] } };

  revalidatePath('/[locale]/(admin)/admin/spoken-languages', 'layout');
  revalidatePath('/[locale]/(admin)/admin/form-builder', 'layout');

  return { data: { code: parsed.data } };
}
