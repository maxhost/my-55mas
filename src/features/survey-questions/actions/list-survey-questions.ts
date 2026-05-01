'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  SurveyQuestionTranslation,
  SurveyQuestionWithTranslations,
} from '../types';

type I18nEntry = {
  label?: string;
  description?: string | null;
  option_labels?: Record<string, string> | null;
};

type I18nRecord = Record<string, I18nEntry | null> | null;

function flattenSurveyI18n(i18n: I18nRecord): Record<string, SurveyQuestionTranslation> {
  const out: Record<string, SurveyQuestionTranslation> = {};
  if (!i18n) return out;
  for (const [locale, entry] of Object.entries(i18n)) {
    const label = entry?.label;
    if (typeof label !== 'string') continue;
    const t: SurveyQuestionTranslation = { label };
    if (entry?.description) t.description = entry.description;
    if (entry?.option_labels) t.option_labels = entry.option_labels;
    out[locale] = t;
  }
  return out;
}

export async function listSurveyQuestions(): Promise<SurveyQuestionWithTranslations[]> {
  const supabase = createClient();

  const { data: questions, error } = await supabase
    .from('survey_questions')
    .select('id, key, response_type, options, sort_order, is_active, i18n')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  if (!questions || questions.length === 0) return [];

  return questions.map((q) => ({
    id: q.id,
    key: q.key,
    response_type: q.response_type as SurveyQuestionWithTranslations['response_type'],
    options: q.options as string[] | null,
    sort_order: q.sort_order ?? 0,
    is_active: q.is_active,
    translations: flattenSurveyI18n(q.i18n as I18nRecord),
  }));
}
