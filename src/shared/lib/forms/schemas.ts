import { z } from 'zod';
import { FIELD_TYPES, STEP_ACTION_TYPES } from './types';
import { isValidMapping } from './db-column-registry';

// ── Key validation ────────────────────────────────────

const keySchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z][a-z0-9_]*$/, 'Key must be snake_case starting with a letter');

// ── Form Field ────────────────────────────────────────

export const formFieldSchema = z
  .object({
    key: keySchema,
    type: z.enum(FIELD_TYPES),
    required: z.boolean().default(false),
    options: z.array(z.string().min(1).max(100)).optional(),
    options_snapshot: z
      .array(z.object({ value: z.string().min(1), label: z.string().min(1) }))
      .optional(),
    subtype_group: z.string().optional(),
    survey_question_key: z.string().optional(),
    db_table: z.string().optional(),
    db_column: z.string().optional(),
  })
  .refine(
    (field) => {
      if (field.type === 'single_select' || field.type === 'multiselect') {
        const hasOptions = !!field.options && field.options.length > 0;
        const hasSnapshot = !!field.options_snapshot && field.options_snapshot.length > 0;
        return hasOptions || hasSnapshot;
      }
      return true;
    },
    { message: 'Select fields must have at least one option' }
  )
  .refine(
    (field) => {
      if (field.type !== 'db_column') return true;
      if (!field.db_table || !field.db_column) return false;
      return isValidMapping(field.db_table, field.db_column);
    },
    { message: 'db_column fields require a valid db_table and db_column from the registry' }
  );

// ── Step Action ───────────────────────────────────────

export const stepActionSchema = z.object({
  key: keySchema,
  type: z.enum(STEP_ACTION_TYPES),
  redirect_url: z
    .string()
    .startsWith('/', 'Redirect URL must start with /')
    .max(200)
    .optional(),
});

// ── Form Step ─────────────────────────────────────────

export const formStepSchema = z.object({
  key: keySchema,
  fields: z.array(formFieldSchema).min(1),
  actions: z.array(stepActionSchema).optional(),
});

// ── Form Schema ───────────────────────────────────────

export const formSchemaSchema = z
  .object({
    steps: z.array(formStepSchema).min(1),
  })
  .refine(
    (schema) => {
      const seen = new Set<string>();
      for (const step of schema.steps) {
        for (const field of step.fields) {
          if (field.type === 'db_column' && field.db_table && field.db_column) {
            const key = `${field.db_table}.${field.db_column}`;
            if (seen.has(key)) return false;
            seen.add(key);
          }
        }
      }
      return true;
    },
    { message: 'Duplicate db_column mapping: each table.column can only be mapped once per form' }
  );

// ── Save Form Input ───────────────────────────────────

export const saveFormSchema = z.object({
  service_id: z.string().uuid(),
  city_id: z.string().uuid().nullable().default(null),
  schema: formSchemaSchema,
});

export type SaveFormInput = z.input<typeof saveFormSchema>;

// ── Save Form Translations Input ──────────────────────

export const saveFormTranslationsSchema = z.object({
  form_id: z.string().uuid(),
  locale: z.string().min(2).max(5),
  labels: z.record(z.string()),
  placeholders: z.record(z.string()),
  option_labels: z.record(z.string()),
});

export type SaveFormTranslationsInput = z.input<
  typeof saveFormTranslationsSchema
>;

// ── Save Form + Translations (combined) ──────────────

export const saveFormWithTranslationsSchema = z.object({
  service_id: z.string().uuid(),
  city_id: z.string().uuid().nullable().default(null),
  schema: formSchemaSchema,
  locale: z.string().min(2).max(5),
  labels: z.record(z.string()),
  placeholders: z.record(z.string()),
  option_labels: z.record(z.string()),
});

export type SaveFormWithTranslationsInput = z.input<
  typeof saveFormWithTranslationsSchema
>;

// ── Clone Form Variant ───────────────────────────────

export const cloneFormVariantSchema = z.object({
  service_id: z.string().uuid(),
  source_city_id: z.string().uuid().nullable(),
  target_city_id: z.string().uuid(),
});
