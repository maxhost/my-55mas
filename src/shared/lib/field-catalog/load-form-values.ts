import type { ResolvedField } from './resolved-types';
import type {
  DbColumnTarget,
  SurveyTarget,
  SubtypeTarget,
} from './types';
import { readDbColumn } from './persistence/db-column';
import { readAuth } from './persistence/auth';
import { readFormResponse } from './persistence/form-response';
import { readSurvey } from './persistence/survey';
import { readServiceSelect } from './persistence/service-select';
import { readSubtype } from './persistence/subtype';
import type { Sb } from './persistence/context';

export type LoadedValues = Record<string, unknown>;

// Lee valores actuales del usuario por field_definition_id.
// Despacha según persistence_type al adapter correspondiente.
// Auth retorna el email del user actual (vía session) si hay userId;
// undefined en contextos de signup.
export async function loadFormValues(
  supabase: Sb,
  userId: string | null,
  fields: ResolvedField[]
): Promise<LoadedValues> {
  // Nota: antes retornábamos {} si userId null. Ahora permitimos que los
  // adapters decidan (auth en signup flow SÍ es consultado y retorna
  // undefined limpio).
  const entries = await Promise.all(
    fields.map(async (field): Promise<[string, unknown]> => {
      const value = await readOne(supabase, userId, field);
      return [field.field_definition_id, value];
    })
  );
  return Object.fromEntries(entries.filter(([, v]) => v !== undefined));
}

async function readOne(
  supabase: Sb,
  userId: string | null,
  field: ResolvedField
): Promise<unknown> {
  switch (field.persistence_type) {
    case 'db_column':
      if (!userId) return undefined;
      return readDbColumn(supabase, userId, field.persistence_target as DbColumnTarget);
    case 'auth':
      return readAuth(supabase, userId);
    case 'form_response':
      if (!userId) return undefined;
      return readFormResponse(supabase, userId, field.field_definition_id);
    case 'survey':
      if (!userId) return undefined;
      return readSurvey(supabase, userId, field.persistence_target as SurveyTarget);
    case 'service_select':
      if (!userId) return undefined;
      return readServiceSelect(supabase, userId);
    case 'subtype':
      if (!userId) return undefined;
      return readSubtype(supabase, userId, field.persistence_target as SubtypeTarget);
    case 'none':
      return undefined;
    default:
      return undefined;
  }
}
