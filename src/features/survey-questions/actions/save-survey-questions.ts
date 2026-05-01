'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveSurveyQuestionsSchema } from '../schemas';
import type { SaveSurveyQuestionsInput, SurveyQuestionInput } from '../types';

/**
 * Saves all survey questions (full replace strategy):
 * 1. Delete removed questions (CASCADE handles translations)
 * 2. Upsert existing + new questions
 * 3. Upsert translations per locale
 */
export async function saveSurveyQuestions(input: SaveSurveyQuestionsInput) {
  const parsed = saveSurveyQuestionsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { questions } = parsed.data;
  const supabase = createClient();

  // 1. Get existing question IDs
  const { data: existing } = await supabase
    .from('survey_questions')
    .select('id');

  const existingIds = (existing ?? []).map((e) => e.id);
  const incomingIds = questions.filter((q) => q.id).map((q) => q.id!);
  const incomingIdSet = new Set(incomingIds);

  // 2. Delete removed questions (CASCADE deletes translations)
  const toDelete = existingIds.filter((id) => !incomingIdSet.has(id));
  if (toDelete.length > 0) {
    const { error } = await supabase.from('survey_questions').delete().in('id', toDelete);
    if (error) return { error: { _db: [error.message] } };
  }

  // 3. Upsert each question + translations
  for (const question of questions) {
    const result = await upsertQuestion(supabase, question);
    if (result?.error) return result;
  }

  revalidatePath('/[locale]/(admin)/admin/survey-questions', 'layout');
  return { data: true };
}

async function upsertQuestion(
  supabase: ReturnType<typeof createClient>,
  question: SurveyQuestionInput
) {
  // Build i18n jsonb. Each locale entry has label + optional description +
  // optional option_labels (nested record).
  const i18n: Record<string, Record<string, unknown>> = {};
  for (const [locale, trans] of Object.entries(question.translations)) {
    const entry: Record<string, unknown> = { label: trans.label };
    if (trans.description) entry.description = trans.description;
    if (trans.option_labels) entry.option_labels = trans.option_labels;
    i18n[locale] = entry;
  }

  const i18nJson = i18n as unknown as Json;

  if (question.id) {
    // Update existing (key is read-only after creation)
    const { error } = await supabase
      .from('survey_questions')
      .update({
        response_type: question.response_type,
        options: question.options,
        sort_order: question.sort_order,
        is_active: question.is_active,
        i18n: i18nJson,
      })
      .eq('id', question.id);
    if (error) return { error: { _db: [error.message] } };
  } else {
    const { error } = await supabase
      .from('survey_questions')
      .insert({
        key: question.key,
        response_type: question.response_type,
        options: question.options,
        sort_order: question.sort_order,
        is_active: question.is_active,
        i18n: i18nJson,
      })
      .select('id')
      .single();
    if (error) return { error: { _db: [error.message] } };
  }
}
