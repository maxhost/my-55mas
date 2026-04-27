import { z } from 'zod';
import { STEP_ACTION_TYPES } from '@/shared/lib/forms/types';
import { INPUT_TYPES, PERSISTENCE_TYPES } from './types';
import type { CatalogFormSchema } from './schema-types';

// ── Field Definition row ────────────────────────────

const baseDefinitionFields = {
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  key: z.string().min(1),
  input_type: z.enum(INPUT_TYPES),
  options: z.array(z.string()).nullable(),
  options_source: z.string().nullable(),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
};

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

const subtypeTargetSchema = z.object({
  subtype_group: z.string().min(1),
});

export const fieldDefinitionSchema = z.discriminatedUnion('persistence_type', [
  z.object({
    ...baseDefinitionFields,
    persistence_type: z.literal('db_column'),
    persistence_target: dbColumnTargetSchema,
  }),
  z.object({
    ...baseDefinitionFields,
    persistence_type: z.literal('auth'),
    persistence_target: authTargetSchema,
  }),
  z.object({
    ...baseDefinitionFields,
    persistence_type: z.literal('form_response'),
    persistence_target: z.null(),
  }),
  z.object({
    ...baseDefinitionFields,
    persistence_type: z.literal('survey'),
    persistence_target: surveyTargetSchema,
  }),
  z.object({
    ...baseDefinitionFields,
    persistence_type: z.literal('service_select'),
    persistence_target: z.null(),
  }),
  z.object({
    ...baseDefinitionFields,
    persistence_type: z.literal('subtype'),
    persistence_target: subtypeTargetSchema,
  }),
  z.object({
    ...baseDefinitionFields,
    persistence_type: z.literal('none'),
    persistence_target: z.null(),
  }),
]);

// ── Catalog Form Schema (referenced by registration_forms.schema etc.) ──

const catalogFieldRefSchema = z.object({
  field_definition_id: z.string().uuid(),
  required: z.boolean(),
});

const stepActionSchema = z.object({
  key: z.string().min(1),
  type: z.enum(STEP_ACTION_TYPES),
  redirect_url: z.string().optional(),
});

const catalogFormStepSchema = z.object({
  key: z.string().min(1),
  field_refs: z.array(catalogFieldRefSchema),
  actions: z.array(stepActionSchema).optional(),
});

export const catalogFormSchemaSchema = z.object({
  steps: z.array(catalogFormStepSchema).min(1),
});

// Asserts at compile-time that schema output matches the declared type.
// Keeps schema-types.ts and runtime validation in sync.
const _typeCheck: CatalogFormSchema = {} as z.infer<typeof catalogFormSchemaSchema>;
void _typeCheck;

// ── Public wrapper ──────────────────────────────────

export type CatalogValidationKind = 'registration' | 'talent-service';

export type CatalogValidationContext = {
  kind: CatalogValidationKind;
};

export type ValidateCatalogFormSchemaResult =
  | { ok: true; data: CatalogFormSchema }
  | { ok: false; errors: z.ZodError };

// Valida el schema. Si `context.kind === 'talent-service'` aplica reglas
// extra: el action `register` no se permite (talent forms no crean usuarios;
// el talent ya está autenticado). Default kind: 'registration'.
export function validateCatalogFormSchema(
  input: unknown,
  context: CatalogValidationContext = { kind: 'registration' }
): ValidateCatalogFormSchemaResult {
  const result = catalogFormSchemaSchema.safeParse(input);
  if (!result.success) return { ok: false, errors: result.error };

  if (context.kind === 'talent-service') {
    const offending: string[] = [];
    for (const step of result.data.steps) {
      for (const action of step.actions ?? []) {
        if (action.type === 'register') {
          offending.push(`${step.key}.${action.key}`);
        }
      }
    }
    if (offending.length > 0) {
      const issue: z.ZodIssue = {
        code: z.ZodIssueCode.custom,
        path: ['steps'],
        message: `register action not allowed in talent-service forms: ${offending.join(', ')}`,
      };
      const error = new z.ZodError([issue]);
      return { ok: false, errors: error };
    }
  }

  return { ok: true, data: result.data as CatalogFormSchema };
}

// Sentinel exports for downstream validation
export const SUPPORTED_INPUT_TYPES = INPUT_TYPES;
export const SUPPORTED_PERSISTENCE_TYPES = PERSISTENCE_TYPES;
