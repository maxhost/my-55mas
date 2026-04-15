// ── Field Types ───────────────────────────────────────

export const FIELD_TYPES = [
  'text',
  'number',
  'multiline_text',
  'boolean',
  'single_select',
  'multiselect',
  'file',
  'subtype',
  'survey',
  'email',
  'password',
  'db_column',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPES_WITH_OPTIONS: FieldType[] = [
  'single_select',
  'multiselect',
];

// ── Step Action Types ─────────────────────────────────

export const STEP_ACTION_TYPES = ['next', 'back', 'submit', 'register'] as const;

export type StepActionType = (typeof STEP_ACTION_TYPES)[number];

export type StepAction = {
  key: string;
  type: StepActionType;
  redirect_url?: string;
};

// ── Form Schema Structure ─────────────────────────────

export type FormFieldOptionSnapshot = {
  value: string;
  label: string;
};

export type FormField = {
  key: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  options_snapshot?: FormFieldOptionSnapshot[];
  subtype_group?: string; // slug del grupo (solo para type === 'subtype')
  survey_question_key?: string; // key de survey_questions (solo para type === 'survey')
  db_table?: string; // tabla destino (solo para type === 'db_column')
  db_column?: string; // columna destino (solo para type === 'db_column')
};

export type FormStep = {
  key: string;
  fields: FormField[];
  actions?: StepAction[];
};

export type FormSchema = {
  steps: FormStep[];
};

// ── Form Translations ─────────────────────────────────

export type FormTranslationData = {
  labels: Record<string, string>;
  placeholders: Record<string, string>;
  option_labels: Record<string, string>;
};

// ── DB-derived types ──────────────────────────────────

export type FormDetail = {
  id: string;
  service_id: string;
  city_id: string | null;
  schema: FormSchema;
  version: number;
  is_active: boolean;
};

export type FormWithTranslations = FormDetail & {
  translations: Record<string, FormTranslationData>;
};

// ── Variant summary (for variant selector) ───────────

export type FormVariantSummary = {
  id: string;
  city_id: string | null;
  city_name: string | null;
  country_id: string | null;
  version: number;
  is_active: boolean;
};

// ── Country option (forms-local, for first dropdown) ──

export type FormCountryOption = {
  id: string;
  name: string;
};

// ── City option (for second dropdown) ─────────────────

export type FormCityOption = {
  id: string;
  name: string;
  country_id: string;
};

// ── Callback result types (for shared components) ─────

export type SaveFormResult =
  | { error: Record<string, string[] | undefined> }
  | { data: { id: string } };

export type CloneFormResult = {
  data?: FormWithTranslations;
  error?: string;
};

// ── Survey question render data (for FormRenderer) ───

export type SurveyQuestionRenderData = {
  key: string;
  response_type: string;
  options: string[] | null;
  label: string;
  description?: string;
  option_labels?: Record<string, string>;
};

// ── Helpers ───────────────────────────────────────────

/**
 * Normalize legacy flat schema ({ fields: [...] }) to step-based schema.
 */
export function normalizeSchema(raw: unknown): FormSchema {
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'steps' in raw &&
    Array.isArray((raw as FormSchema).steps)
  ) {
    return raw as FormSchema;
  }

  // Legacy flat format: { fields: [...] }
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'fields' in raw &&
    Array.isArray((raw as { fields: FormField[] }).fields)
  ) {
    return {
      steps: [{ key: 'default', fields: (raw as { fields: FormField[] }).fields }],
    };
  }

  return { steps: [] };
}
