import { z } from 'zod';
import { FIELD_TYPES } from './types';

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
    subtype_group: z.string().optional(),
    survey_question_key: z.string().optional(),
  })
  .refine(
    (field) => {
      if (field.type === 'single_select' || field.type === 'multiselect') {
        return field.options && field.options.length > 0;
      }
      return true;
    },
    { message: 'Select fields must have at least one option' }
  );

// ── Form Step ─────────────────────────────────────────

export const formStepSchema = z.object({
  key: keySchema,
  fields: z.array(formFieldSchema).min(1),
});

// ── Form Schema ───────────────────────────────────────

export const formSchemaSchema = z.object({
  steps: z.array(formStepSchema).min(1),
});

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
