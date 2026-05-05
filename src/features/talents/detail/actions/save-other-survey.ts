'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveOtherSurveySchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Persists survey answers to `survey_responses`. PK is implicit (id), but we
 * de-duplicate by (user_id, key): existing rows for the same key get deleted
 * before re-inserting. Only keys present in `responses` are touched — others
 * remain.
 */
export async function saveTalentOtherSurvey(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = saveOtherSurveySchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { talentId, responses } = parsed.data;

  const { data: tp, error: tpErr } = await supabase
    .from('talent_profiles')
    .select('user_id')
    .eq('id', talentId)
    .maybeSingle();
  if (tpErr) return { error: { message: tpErr.message } };
  if (!tp) return { error: { message: 'Talent not found' } };

  const keys = Object.keys(responses);
  if (keys.length === 0) return { data: { ok: true } };

  const { error: delErr } = await supabase
    .from('survey_responses')
    .delete()
    .eq('user_id', tp.user_id)
    .in('key', keys);
  if (delErr) return { error: { message: delErr.message } };

  const inserts = keys
    .filter((k) => responses[k] !== null && responses[k] !== undefined && responses[k] !== '')
    .map((k) => ({
      user_id: tp.user_id,
      key: k,
      value: typeof responses[k] === 'string' ? (responses[k] as string) : JSON.stringify(responses[k]),
    }));
  if (inserts.length > 0) {
    const { error } = await supabase.from('survey_responses').insert(inserts);
    if (error) return { error: { message: error.message } };
  }

  revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');
  return { data: { ok: true } };
}
