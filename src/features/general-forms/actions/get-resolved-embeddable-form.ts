'use server';

import { createClient } from '@/lib/supabase/server';
import { resolveFormFromJson } from '@/shared/lib/field-catalog/resolve-form-from-json';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';
import { getEmbeddableForm } from './get-embeddable-form';
import { loadRegistrationFormLabels } from './load-registration-form-labels';

type ResolvedEmbeddableResult =
  | { available: false }
  | {
      available: true;
      resolvedForm: ResolvedForm;
      targetRole: 'talent' | 'client';
    };

// Combina getEmbeddableForm (busca slug + city) con resolveFormFromJson +
// labels pre-cargados desde registration_form_translations. Si el schema
// en DB aún es FormSchema legacy, retorna ResolvedForm vacío (hasta que
// el usuario recree el form con CatalogFieldRef vía admin).
export async function getResolvedEmbeddableForm(
  slug: string,
  cityId: string,
  locale: string
): Promise<ResolvedEmbeddableResult> {
  const result = await getEmbeddableForm(slug, cityId);
  if (!result.available) return { available: false };

  const supabase = createClient();
  const [
    {
      data: { user },
    },
    formLabels,
  ] = await Promise.all([
    supabase.auth.getUser(),
    loadRegistrationFormLabels(supabase, result.form.id, locale),
  ]);

  const resolvedForm = await resolveFormFromJson({
    supabase,
    schemaJson: result.form.schema,
    userId: user?.id ?? null,
    locale,
    formLabels,
  });

  return {
    available: true,
    resolvedForm,
    targetRole: result.form.target_role,
  };
}
