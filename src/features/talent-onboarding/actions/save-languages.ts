'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveLanguagesSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Persists step 6 (Languages) into talent_spoken_languages.
 *
 * Replace strategy: deletes the talent's existing language rows and inserts the
 * new selection in a single transaction (best-effort: the DELETE + INSERT are
 * sequential server-action calls, but the table is idempotent on (talent_id,
 * language_code) PK so a partial failure is recoverable on retry).
 *
 * The talent_profiles row is identified by user_id (FK to auth.users).
 */
export async function saveLanguages(input: unknown): Promise<Result> {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: { message: 'Not authenticated' } };

  const parsed = saveLanguagesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { language_codes } = parsed.data;

  // 1. Resolve talent_id from auth.uid()
  const { data: talentProfile, error: tpError } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (tpError) return { error: { message: tpError.message } };
  if (!talentProfile) return { error: { message: 'Talent profile not found' } };

  const talentId = talentProfile.id;

  // 2. Replace strategy: wipe existing rows for this talent
  const { error: deleteError } = await supabase
    .from('talent_spoken_languages')
    .delete()
    .eq('talent_id', talentId);

  if (deleteError) return { error: { message: deleteError.message } };

  // 3. Insert new rows (deduped to be safe vs. PK violation)
  const uniqueCodes = Array.from(new Set(language_codes));
  if (uniqueCodes.length > 0) {
    const rows = uniqueCodes.map((code) => ({
      talent_id: talentId,
      language_code: code,
    }));

    const { error: insertError } = await supabase
      .from('talent_spoken_languages')
      .insert(rows);

    if (insertError) return { error: { message: insertError.message } };
  }

  revalidatePath('/[locale]/(talent)/portal/onboarding', 'page');
  return { data: { ok: true } };
}
