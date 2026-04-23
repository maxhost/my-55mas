import type { ResolvedField } from './resolved-types';
import type {
  AuthTarget,
  DbColumnTarget,
  SurveyTarget,
  SubtypeTarget,
} from './types';
import { writeDbColumn } from './persistence/db-column';
import {
  writeAuth,
  type AuthFields,
  type AuthSignUpOptions,
} from './persistence/auth';
import { writeFormResponse } from './persistence/form-response';
import { writeSurvey } from './persistence/survey';
import {
  writeServiceSelect,
  type ServiceSelectContext,
} from './persistence/service-select';
import { writeSubtype } from './persistence/subtype';
import { PersistenceError, type Sb } from './persistence/context';

export type PersistContext = {
  // Requerido si algún field tiene persistence_type='service_select'.
  serviceSelect?: ServiceSelectContext;
  // Opciones pasadas a signUp (emailRedirectTo, data).
  authSignUpOptions?: AuthSignUpOptions;
};

export type PersistFormDataInput = {
  supabase: Sb;
  // Si se realiza signUp, userId puede ser null al inicio.
  userId: string | null;
  fields: ResolvedField[];
  // formData es un map key(field.key) → value.
  formData: Record<string, unknown>;
  context?: PersistContext;
};

export type PersistFormDataResult =
  | { ok: true; userId: string }
  | { ok: false; errors: { field?: string; message: string }[] };

export async function persistFormData(
  input: PersistFormDataInput
): Promise<PersistFormDataResult> {
  const { supabase, fields, formData, context } = input;
  const requiredErrors = validateRequired(fields, formData);
  if (requiredErrors.length > 0) return { ok: false, errors: requiredErrors };

  const authFields = fields.filter((f) => f.persistence_type === 'auth');
  const nonAuthFields = fields.filter((f) => f.persistence_type !== 'auth');

  let userId = input.userId;
  if (authFields.length > 0) {
    const collected = collectAuthFields(authFields, formData);
    try {
      const result = await writeAuth(
        supabase,
        collected,
        context?.authSignUpOptions
      );
      userId = result.userId;
    } catch (err) {
      return { ok: false, errors: [{ message: errMsg(err) }] };
    }
  }

  if (!userId) {
    return {
      ok: false,
      errors: [{ message: 'No userId available for persistence' }],
    };
  }

  for (const field of nonAuthFields) {
    const value = formData[field.key];
    try {
      await writeOne(supabase, userId, value, field, context);
    } catch (err) {
      return { ok: false, errors: [{ field: field.key, message: errMsg(err) }] };
    }
  }

  return { ok: true, userId };
}

function validateRequired(
  fields: ResolvedField[],
  formData: Record<string, unknown>
): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];
  for (const field of fields) {
    if (!field.required) continue;
    // display_text / persistence_type='none' no tienen valor que validar.
    if (field.persistence_type === 'none') continue;
    const value = formData[field.key];
    if (value === undefined || value === null || value === '') {
      errors.push({ field: field.key, message: 'required' });
    }
  }
  return errors;
}

function collectAuthFields(
  authFields: ResolvedField[],
  formData: Record<string, unknown>
): AuthFields {
  const collected: AuthFields = {};
  for (const field of authFields) {
    const target = field.persistence_target as AuthTarget;
    const value = formData[field.key];
    if (typeof value !== 'string') continue;
    collected[target.auth_field] = value;
  }
  return collected;
}

async function writeOne(
  supabase: Sb,
  userId: string,
  value: unknown,
  field: ResolvedField,
  context?: PersistContext
): Promise<void> {
  switch (field.persistence_type) {
    case 'db_column':
      return writeDbColumn(
        supabase,
        userId,
        value,
        field.persistence_target as DbColumnTarget
      );
    case 'form_response':
      return writeFormResponse(
        supabase,
        userId,
        field.field_definition_id,
        value
      );
    case 'survey':
      return writeSurvey(
        supabase,
        userId,
        value,
        field.persistence_target as SurveyTarget
      );
    case 'service_select':
      if (!context?.serviceSelect) {
        throw new PersistenceError(
          'service_select write requires context.serviceSelect',
          'missing_context'
        );
      }
      return writeServiceSelect(
        supabase,
        userId,
        asStringArray(value),
        context.serviceSelect
      );
    case 'subtype':
      return writeSubtype(
        supabase,
        userId,
        asStringArray(value),
        field.persistence_target as SubtypeTarget
      );
    case 'auth':
      return;
    case 'none':
      return;
    default:
      throw new PersistenceError(
        `unknown persistence_type: ${field.persistence_type}`,
        'write_failed'
      );
  }
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return [];
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
