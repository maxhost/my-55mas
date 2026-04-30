import { z } from 'zod';
import {
  INPUT_TYPES,
  PERSISTENCE_TYPES,
} from '@/shared/lib/field-catalog/types';
import { CATALOG_LOCALES } from './types';

// ── Translations ────────────────────────────────────
// Solo 'es' es obligatoria (fallback por defecto). Otros locales opcionales.

const groupTranslationsShape = CATALOG_LOCALES.reduce(
  (acc, locale) => {
    acc[locale] =
      locale === 'es'
        ? z.string().min(1, 'missingTranslation')
        : z.string();
    return acc;
  },
  {} as Record<(typeof CATALOG_LOCALES)[number], z.ZodString>
);
export const groupTranslationsSchema = z.object(groupTranslationsShape);

// Todas las entries son opcionales a nivel estructural. La regla "ES debe
// tener contenido" se aplica al final del discriminated union con un
// superRefine que conoce el input_type (display_text exige description,
// el resto exige label).
const fieldTranslationEntryOptionalSchema = z.object({
  label: z.string(),
  placeholder: z.string(),
  description: z.string(),
  option_labels: z.record(z.string(), z.string()).nullable(),
});

const fieldTranslationsShape = CATALOG_LOCALES.reduce(
  (acc, locale) => {
    acc[locale] = fieldTranslationEntryOptionalSchema;
    return acc;
  },
  {} as Record<
    (typeof CATALOG_LOCALES)[number],
    typeof fieldTranslationEntryOptionalSchema
  >
);
export const fieldTranslationsSchema = z.object(fieldTranslationsShape);

// ── Group ───────────────────────────────────────────

export const fieldGroupInputSchema = z.object({
  id: z.string().uuid().nullable(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_-]+$/, 'invalidSlug'),
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
    .regex(/^[a-z0-9_-]+$/, 'invalidKey'),
  input_type: z.enum(INPUT_TYPES),
  options: z.array(z.string()).nullable(),
  options_source: z.string().nullable(),
  config: z.record(z.string(), z.unknown()).nullable(),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  translations: fieldTranslationsSchema,
};

export const fieldDefinitionInputSchema = z
  .discriminatedUnion('persistence_type', [
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
    z.object({
      ...commonDefinitionFields,
      persistence_type: z.literal('none'),
      persistence_target: z.null(),
    }),
  ])
  .superRefine((data, ctx) => {
    // ES es fallback obligatorio. Qué campo ES es obligatorio depende del
    // input_type: display_text → description (es el contenido), resto → label.
    const es = data.translations.es;
    if (data.input_type === 'display_text') {
      if (!es.description || es.description.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['translations', 'es', 'description'],
          message: 'missingContent',
        });
      }
    } else {
      if (!es.label || es.label.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['translations', 'es', 'label'],
          message: 'missingLabel',
        });
      }
    }

    // terms_checkbox: config.tos_url y/o config.privacy_url deben ser
    // URLs válidas si están presentes. Al menos una es obligatoria (sin
    // URLs el field no tiene sentido — es un checkbox legal sin enlaces).
    if (data.input_type === 'terms_checkbox') {
      const cfg = (data.config ?? {}) as {
        tos_url?: unknown;
        privacy_url?: unknown;
      };
      const tos =
        typeof cfg.tos_url === 'string' ? cfg.tos_url.trim() : '';
      const privacy =
        typeof cfg.privacy_url === 'string' ? cfg.privacy_url.trim() : '';
      if (!tos && !privacy) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['config'],
          message: 'missingTermsUrls',
        });
      }
      const urlRegex = /^https?:\/\/.+/i;
      if (tos && !urlRegex.test(tos)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['config', 'tos_url'],
          message: 'invalidUrl',
        });
      }
      if (privacy && !urlRegex.test(privacy)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['config', 'privacy_url'],
          message: 'invalidUrl',
        });
      }
    }

    // talent_services_panel requiere persistence_type='service_select'
    // estrictamente. El renderer del panel persiste a `talent_services`
    // vía writeServiceSelect — cualquier otro persistence_type rompe la
    // semántica (ej: form_response escribiría el array de service_ids
    // en user_form_responses, fuera del flujo del panel).
    if (
      data.input_type === 'talent_services_panel' &&
      data.persistence_type !== 'service_select'
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['persistence_type'],
        message: 'panelRequiresServiceSelect',
      });
    }

    // config.allow_change sólo tiene sentido en email + auth (dispara
    // supabase.auth.updateUser). Rechazamos valores seteados fuera de ese
    // combo para evitar configuraciones confusas o silent no-ops.
    if (data.config && 'allow_change' in data.config) {
      const allowChange = (data.config as { allow_change?: unknown })
        .allow_change;
      if (typeof allowChange !== 'boolean') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['config', 'allow_change'],
          message: 'invalidAllowChange',
        });
      } else if (
        allowChange === true &&
        !(data.input_type === 'email' && data.persistence_type === 'auth')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['config', 'allow_change'],
          message: 'allowChangeOnlyForEmailAuth',
        });
      }
    }
  });

// ── Public sentinels ────────────────────────────────

export const SUPPORTED_INPUT_TYPES = INPUT_TYPES;
export const SUPPORTED_PERSISTENCE_TYPES = PERSISTENCE_TYPES;
