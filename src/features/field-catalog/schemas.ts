import { z } from 'zod';
import {
  INPUT_TYPES,
  PERSISTENCE_TYPES,
} from '@/shared/lib/field-catalog/types';
import { CATALOG_LOCALES } from './types';

// ── Translations ────────────────────────────────────

const groupTranslationsShape = CATALOG_LOCALES.reduce(
  (acc, locale) => {
    acc[locale] = z.string().min(1, 'missingTranslation');
    return acc;
  },
  {} as Record<(typeof CATALOG_LOCALES)[number], z.ZodString>
);
export const groupTranslationsSchema = z.object(groupTranslationsShape);

const fieldTranslationEntrySchema = z.object({
  label: z.string().min(1, 'missingLabel'),
  placeholder: z.string(),
  description: z.string(),
  option_labels: z.record(z.string(), z.string()).nullable(),
});

const fieldTranslationsShape = CATALOG_LOCALES.reduce(
  (acc, locale) => {
    acc[locale] = fieldTranslationEntrySchema;
    return acc;
  },
  {} as Record<(typeof CATALOG_LOCALES)[number], typeof fieldTranslationEntrySchema>
);
export const fieldTranslationsSchema = z.object(fieldTranslationsShape);

// ── Group ───────────────────────────────────────────

export const fieldGroupInputSchema = z.object({
  id: z.string().uuid().nullable(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, 'invalidSlug'),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  translations: groupTranslationsSchema,
});

// ── Field definition ────────────────────────────────

const dbColumnTargetSchema = z.object({
  table: z.string().min(1),
  column: z.string().min(1),
});
const authTargetSchema = z.object({
  auth_field: z.enum(['email', 'password', 'confirm_password']),
});
const surveyTargetSchema = z.object({
  survey_question_key: z.string().min(1),
});
const subtypeTargetSchema = z.object({ subtype_group: z.string().min(1) });

const commonDefinitionFields = {
  id: z.string().uuid().nullable(),
  group_id: z.string().uuid(),
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_]+$/, 'invalidKey'),
  input_type: z.enum(INPUT_TYPES),
  options: z.array(z.string()).nullable(),
  options_source: z.string().nullable(),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  translations: fieldTranslationsSchema,
};

export const fieldDefinitionInputSchema = z.discriminatedUnion(
  'persistence_type',
  [
    z.object({
      ...commonDefinitionFields,
      persistence_type: z.literal('db_column'),
      persistence_target: dbColumnTargetSchema,
    }),
    z.object({
      ...commonDefinitionFields,
      persistence_type: z.literal('auth'),
      persistence_target: authTargetSchema,
    }),
    z.object({
      ...commonDefinitionFields,
      persistence_type: z.literal('form_response'),
      persistence_target: z.null(),
    }),
    z.object({
      ...commonDefinitionFields,
      persistence_type: z.literal('survey'),
      persistence_target: surveyTargetSchema,
    }),
    z.object({
      ...commonDefinitionFields,
      persistence_type: z.literal('service_select'),
      persistence_target: z.null(),
    }),
    z.object({
      ...commonDefinitionFields,
      persistence_type: z.literal('subtype'),
      persistence_target: subtypeTargetSchema,
    }),
  ]
);

// ── Public sentinels ────────────────────────────────

export const SUPPORTED_INPUT_TYPES = INPUT_TYPES;
export const SUPPORTED_PERSISTENCE_TYPES = PERSISTENCE_TYPES;
