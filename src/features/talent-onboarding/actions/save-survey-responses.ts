'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveSurveyResponsesSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Persists step 7 (Survey responses) into survey_responses.
 *
 * Storage shape: survey_responses.value is a single TEXT column. Strings go in
 * raw; everything else (boolean/number/array/object) is JSON.stringify'd and
 * recovered with tryParseJson on read.
 *
 * Upsert strategy: the table has a UNIQUE constraint on (user_id, key)
 * (survey_responses_user_id_key_key), so we can use the idiomatic
 * .upsert(..., { onConflict: 'user_id,key' }) in a single bulk request.
 *
 * Important: keys NOT present in the input are intentionally preserved. A
 * talent may have answered legacy questions in a previous session that admin
 * later deactivated; we want to keep that history.
 */
export async function saveSurveyResponses(input: unknown): Promise<Result> {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: { message: 'Not authenticated' } };

  const parsed = saveSurveyResponsesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const responses = parsed.data;

  const userId = auth.user.id;
  const rows = Object.entries(responses).map(([key, value]) => ({
    user_id: userId,
    key,
    value: serializeAnswer(value),
  }));

  if (rows.length === 0) {
    revalidatePath('/[locale]/(talent)/portal/onboarding', 'page');
    return { data: { ok: true } };
  }

  const { error } = await supabase
    .from('survey_responses')
    .upsert(rows, { onConflict: 'user_id,key' });

  if (error) return { error: { message: error.message } };

  revalidatePath('/[locale]/(talent)/portal/onboarding', 'page');
  return { data: { ok: true } };
}

// ── Helpers ──────────────────────────────────────────────────

function serializeAnswer(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}
