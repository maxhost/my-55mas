'use server';

import { createClient } from '@/lib/supabase/server';
import type { SurveyQuestionWithTranslations, SurveyQuestionTranslation } from '../types';

/**
 * Lists all survey questions with translations, sorted by sort_order.
 */
export async function listSurveyQuestions(): Promise<SurveyQuestionWithTranslations[]> {
  const supabase = createClient();

  const { data: questions, error } = await supabase
    .from('survey_questions')
    .select('id, key, response_type, options, sort_order, is_active, survey_question_translations(locale, label, description, option_labels)')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  if (!questions || questions.length === 0) return [];

  return questions.map((q) => {
    const translations: Record<string, SurveyQuestionTranslation> = {};
    const rawTrans = q.survey_question_translations as unknown as {
      locale: string;
      label: string;
      description: string | null;
      option_labels: Record<string, string> | null;
    }[];

    for (const t of rawTrans) {
      translations[t.locale] = {
        label: t.label,
        ...(t.description ? { description: t.description } : {}),
        ...(t.option_labels ? { option_labels: t.option_labels } : {}),
      };
    }

    return {
      id: q.id,
      key: q.key,
      response_type: q.response_type as SurveyQuestionWithTranslations['response_type'],
      options: q.options as string[] | null,
      sort_order: q.sort_order ?? 0,
      is_active: q.is_active,
      translations,
    };
  });
}
