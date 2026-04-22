'use server';

import { createClient } from '@/lib/supabase/server';
import { resolveFormFromJson } from '@/shared/lib/field-catalog/resolve-form-from-json';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';
import { getEmbeddableForm } from './get-embeddable-form';

type ResolvedEmbeddableResult =
  | { available: false }
  | {
      available: true;
      resolvedForm: ResolvedForm;
      targetRole: 'talent' | 'client';
    };

// Combina getEmbeddableForm (busca slug + city) con resolveFormFromJson.
// Si el schema en DB aún es FormSchema legacy, retorna ResolvedForm vacío
// (hasta que el usuario recree el form con CatalogFieldRef vía admin).
export async function getResolvedEmbeddableForm(
  slug: string,
  cityId: string,
  locale: string
): Promise<ResolvedEmbeddableResult> {
  const result = await getEmbeddableForm(slug, cityId);
  if (!result.available) return { available: false };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedForm = await resolveFormFromJson({
    supabase,
    schemaJson: result.form.schema,
    userId: user?.id ?? null,
    locale,
  });

  return {
    available: true,
    resolvedForm,
    targetRole: result.form.target_role,
  };
}
