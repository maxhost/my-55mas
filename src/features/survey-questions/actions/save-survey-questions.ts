'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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
  let questionId: string;

  if (question.id) {
    // Update existing (key is read-only after creation — don't update it)
    const { error } = await supabase
      .from('survey_questions')
      .update({
        response_type: question.response_type,
        options: question.options,
        sort_order: question.sort_order,
        is_active: question.is_active,
      })
      .eq('id', question.id);
    if (error) return { error: { _db: [error.message] } };
    questionId = question.id;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('survey_questions')
      .insert({
        key: question.key,
        response_type: question.response_type,
        options: question.options,
        sort_order: question.sort_order,
        is_active: question.is_active,
      })
      .select('id')
      .single();
    if (error) return { error: { _db: [error.message] } };
    questionId = data.id;
  }

  // Upsert translations
  for (const [locale, trans] of Object.entries(question.translations)) {
    const { error } = await supabase
      .from('survey_question_translations')
      .upsert(
        {
          question_id: questionId,
          locale,
          label: trans.label,
          description: trans.description ?? null,
          option_labels: trans.option_labels ?? null,
        },
        { onConflict: 'question_id,locale' }
      );
    if (error) return { error: { _db: [error.message] } };
  }
}
