// ── Field Types ───────────────────────────────────────

export const FIELD_TYPES = [
  'text',
  'number',
  'multiline_text',
  'boolean',
  'single_select',
  'multiselect',
  'file',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPES_WITH_OPTIONS: FieldType[] = [
  'single_select',
  'multiselect',
];

// ── Form Schema Structure ─────────────────────────────

export type FormField = {
  key: string;
  type: FieldType;
  required: boolean;
  options?: string[];
};

export type FormStep = {
  key: string;
  fields: FormField[];
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
  country_id: string | null;
  schema: FormSchema;
  version: number;
  is_active: boolean;
};

export type FormWithTranslations = FormDetail & {
  translations: Record<string, FormTranslationData>;
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
