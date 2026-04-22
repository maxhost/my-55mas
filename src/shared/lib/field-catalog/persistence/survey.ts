import type { SurveyTarget } from '../types';
import { PersistenceError, type Sb } from './context';

export async function readSurvey(
  supabase: Sb,
  userId: string,
  target: SurveyTarget
): Promise<unknown> {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('value')
    .eq('user_id', userId)
    .eq('key', target.survey_question_key)
    .maybeSingle();
  if (error) {
    throw new PersistenceError(
      `read survey_responses failed: ${error.message}`,
      'read_failed'
    );
  }
  return data?.value ?? undefined;
}

export async function writeSurvey(
  supabase: Sb,
  userId: string,
  value: unknown,
  target: SurveyTarget
): Promise<void> {
  const textValue =
    value === null || value === undefined ? null : String(value);
  const { error } = await supabase
    .from('survey_responses')
    .upsert(
      {
        user_id: userId,
        key: target.survey_question_key,
        value: textValue,
      },
      { onConflict: 'user_id,key' }
    );
  if (error) {
    throw new PersistenceError(
      `upsert survey_responses failed: ${error.message}`,
      'write_failed'
    );
  }
}
