import { resolveForm, type FormLabels } from './resolve-form';
import { validateCatalogFormSchema } from './catalog-schema-validation';
import type { ResolvedForm } from './resolved-types';
import type { Sb } from './persistence/context';

// Safely resolve a schema from a jsonb column. Returns empty steps
// when the schema is not a valid CatalogFormSchema (e.g. legacy
// FormSchema still in DB before the user recreates the form via admin).
// `formLabels` is the merged per-locale labels dict (locale over 'es'),
// keyed by step.key / action.key. Missing keys fall back to the key itself
// inside resolveForm.
export async function resolveFormFromJson(input: {
  supabase: Sb;
  schemaJson: unknown;
  userId: string | null;
  locale: string;
  formLabels?: FormLabels;
}): Promise<ResolvedForm> {
  const validation = validateCatalogFormSchema(input.schemaJson);
  if (!validation.ok) {
    return { steps: [] };
  }
  return resolveForm({
    supabase: input.supabase,
    schema: validation.data,
    userId: input.userId,
    locale: input.locale,
    formLabels: input.formLabels,
  });
}
