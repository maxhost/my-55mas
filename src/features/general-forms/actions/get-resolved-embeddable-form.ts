'use server';

import { createClient } from '@/lib/supabase/server';
import { resolveFormFromJson } from '@/shared/lib/field-catalog/resolve-form-from-json';
import type { EmbedResolverResult } from '@/shared/lib/embed/types';
import {
  isEmptySchema,
  isLegacySchema,
} from '@/shared/lib/embed/empty-schema-check';
import { getEmbeddableForm } from './get-embeddable-form';
import { loadRegistrationFormLabels } from './load-registration-form-labels';

export type RegistrationEmbedMeta = {
  formId: string;
  targetRole: 'talent' | 'client';
};

// Combina getEmbeddableForm (busca slug + city) con resolveFormFromJson +
// labels pre-cargados desde registration_form_translations. Detecta
// schemas legacy (FormField[] inline, pre-catálogo) y schemas vacíos
// para devolver razones explícitas en vez de un form vacío que confunda
// al embedder.
export async function getResolvedEmbeddableForm(
  slug: string,
  cityId: string,
  locale: string
): Promise<EmbedResolverResult<RegistrationEmbedMeta>> {
  const result = await getEmbeddableForm(slug, cityId);
  if (!result.available) {
    return { available: false, reason: result.reason };
  }

  // Schema check ANTES del resolve — `resolveFormFromJson` retornaría
  // `{ steps: [] }` para un schema legacy, indistinguible de un form
  // recién creado. Detectamos la forma original.
  if (isLegacySchema(result.form.schema)) {
    return { available: false, reason: 'legacy-schema' };
  }

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

  if (isEmptySchema(resolvedForm)) {
    return { available: false, reason: 'empty-schema' };
  }

  return {
    available: true,
    resolvedForm,
    meta: {
      formId: result.form.id,
      targetRole: result.form.target_role,
    },
  };
}
