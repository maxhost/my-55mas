import type { ManualOption, Question, QuestionType } from './types';

/** A survey_questions row already adapted to the question-renderers framework. */
export type SurveyQuestion = Question;

/**
 * Maps survey_questions.response_type (DB snake_case) to QuestionType used by
 * the question-renderers framework. Unknown types fall back to 'text'.
 */
export function mapResponseType(responseType: string): QuestionType {
  switch (responseType) {
    case 'text':
      return 'text';
    case 'multiline_text':
      return 'multilineText';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'single_select':
      return 'singleSelect';
    case 'multi_select':
      return 'multiSelect';
    default:
      return 'text';
  }
}

type RawSurveyQuestion = {
  key: string;
  response_type: string;
  i18n: unknown;
  options: unknown;
};

type LegacyOption = {
  value?: string;
  label?: string;
  i18n?: Record<string, { label?: string }>;
};

/**
 * Adapts a raw survey_questions row to the Question shape consumed by
 * ServiceQuestionsRenderer. Survey questions don't carry their own `required`
 * flag yet; treat them all as optional (the wizard sets `required=false`).
 */
export function adaptSurveyQuestion(raw: RawSurveyQuestion): SurveyQuestion {
  const type = mapResponseType(raw.response_type);
  const i18n =
    (raw.i18n ?? {}) as Record<string, { label?: string; placeholder?: string; help?: string }>;
  const options: ManualOption[] = adaptOptions(raw.options);

  const q: Question = {
    key: raw.key,
    type,
    required: false,
    i18n,
    ...(type === 'singleSelect' || type === 'multiSelect'
      ? { optionsSource: 'manual' as const, options }
      : {}),
  };
  return q;
}

function adaptOptions(raw: unknown): ManualOption[] {
  if (!Array.isArray(raw)) return [];
  return (raw as LegacyOption[])
    .map((opt) => {
      const value = opt.value;
      if (typeof value !== 'string' || value.length === 0) return null;
      const i18n = opt.i18n ?? (opt.label ? { es: { label: opt.label } } : {});
      return { value, i18n } as ManualOption;
    })
    .filter((o): o is ManualOption => o !== null);
}
