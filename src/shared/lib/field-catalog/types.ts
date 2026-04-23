// ── Input Types (rendering) ──────────────────────────

export const INPUT_TYPES = [
  'text',
  'email',
  'password',
  'number',
  'date',
  'boolean',
  'textarea',
  'single_select',
  'multiselect_checkbox',
  'multiselect_dropdown',
  'address',
  'display_text',
  'terms_checkbox',
] as const;

export type InputType = (typeof INPUT_TYPES)[number];

// ── Persistence Types (storage dispatch) ─────────────

export const PERSISTENCE_TYPES = [
  'db_column',
  'auth',
  'form_response',
  'survey',
  'service_select',
  'subtype',
  'none',
] as const;

export type PersistenceType = (typeof PERSISTENCE_TYPES)[number];

// ── Persistence Targets (per persistence_type) ───────

export type DbColumnTarget = {
  table: string;
  column: string;
};

export type AuthTarget = {
  auth_field: 'email' | 'password' | 'confirm_password';
};

export type SurveyTarget = {
  survey_question_key: string;
};

export type SubtypeTarget = {
  subtype_group: string;
};

export type PersistenceTarget =
  | DbColumnTarget
  | AuthTarget
  | SurveyTarget
  | SubtypeTarget
  | null;

// ── Field Group ──────────────────────────────────────

export type FieldGroup = {
  id: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

export type FieldGroupTranslation = {
  group_id: string;
  locale: string;
  name: string;
};

export type FieldGroupWithTranslations = FieldGroup & {
  translations: Record<string, { name: string }>;
};

// ── Field Definition ─────────────────────────────────

// Configuración específica por input_type (no traducible). Nulo para la
// mayoría; usado por terms_checkbox con { tos_url, privacy_url } y futuros
// input types que necesiten settings globales al field.
export type FieldConfig = Record<string, unknown>;

export type TermsCheckboxConfig = {
  tos_url?: string;
  privacy_url?: string;
};

export type FieldDefinition = {
  id: string;
  group_id: string;
  key: string;
  input_type: InputType;
  persistence_type: PersistenceType;
  persistence_target: PersistenceTarget;
  options: string[] | null;
  options_source: string | null;
  config: FieldConfig | null;
  sort_order: number;
  is_active: boolean;
};

export type FieldDefinitionTranslation = {
  field_id: string;
  locale: string;
  label: string;
  placeholder: string | null;
  description: string | null;
  option_labels: Record<string, string> | null;
};

export type FieldDefinitionWithTranslations = FieldDefinition & {
  translations: Record<string, FieldDefinitionTranslation>;
};

// ── User Form Response ───────────────────────────────

export type UserFormResponse = {
  id: string;
  user_id: string;
  field_definition_id: string;
  value: unknown;
};
