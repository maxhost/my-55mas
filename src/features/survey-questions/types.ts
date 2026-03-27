// ── Response Types ────────────────────────────────────

export const RESPONSE_TYPES = [
  'text',
  'scale_1_5',
  'scale_1_10',
  'single_select',
  'yes_no',
] as const;

export type ResponseType = (typeof RESPONSE_TYPES)[number];

// ── DB-derived types ─────────────────────────────────

export type SurveyQuestion = {
  id: string;
  key: string;
  response_type: ResponseType;
  options: string[] | null;
  sort_order: number;
  is_active: boolean;
};

export type SurveyQuestionTranslation = {
  label: string;
  description?: string;
  option_labels?: Record<string, string>;
};

export type SurveyQuestionWithTranslations = SurveyQuestion & {
  translations: Record<string, SurveyQuestionTranslation>;
};

// ── Input types for save ─────────────────────────────

export type SurveyQuestionInput = {
  id?: string;
  key: string;
  response_type: ResponseType;
  options: string[] | null;
  sort_order: number;
  is_active: boolean;
  translations: Record<string, SurveyQuestionTranslation>;
};

export type SaveSurveyQuestionsInput = {
  questions: SurveyQuestionInput[];
};
