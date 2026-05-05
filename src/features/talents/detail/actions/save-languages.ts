'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveLanguagesSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Reconciles `talent_spoken_languages` for the talent — composite PK is
 * (talent_id, language_code).
 */
export async function saveTalentLanguages(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = saveLanguagesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { talentId, language_codes } = parsed.data;

  const { data: existing, error: fetchErr } = await supabase
    .from('talent_spoken_languages')
    .select('language_code')
    .eq('talent_id', talentId);
  if (fetchErr) return { error: { message: fetchErr.message } };

  const desired = new Set(language_codes);
  const current = new Set((existing ?? []).map((r) => r.language_code));
  const toAdd = language_codes.filter((c) => !current.has(c));
  const toRemove = (existing ?? [])
    .map((r) => r.language_code)
    .filter((c) => !desired.has(c));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('talent_spoken_languages')
      .delete()
      .eq('talent_id', talentId)
      .in('language_code', toRemove);
    if (error) return { error: { message: error.message } };
  }
  if (toAdd.length > 0) {
    const { error } = await supabase
      .from('talent_spoken_languages')
      .insert(toAdd.map((language_code) => ({ talent_id: talentId, language_code })));
    if (error) return { error: { message: error.message } };
  }

  revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');
  return { data: { ok: true } };
}
