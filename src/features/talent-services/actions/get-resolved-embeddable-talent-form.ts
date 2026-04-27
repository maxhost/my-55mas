'use server';

import { createClient } from '@/lib/supabase/server';
import { resolveFormFromJson } from '@/shared/lib/field-catalog/resolve-form-from-json';
import type { ServiceFilter } from '@/shared/lib/field-catalog/resolve-form';
import type { EmbedResolverResult } from '@/shared/lib/embed/types';
import {
  isEmptySchema,
  isLegacySchema,
} from '@/shared/lib/embed/empty-schema-check';
import { getEmbeddableTalentForm } from './get-embeddable-talent-form';
import { loadTalentFormLabels } from './load-talent-form-labels';

export type TalentEmbedMeta = {
  formId: string;
  serviceId: string;
};

// Resuelve el form completo (schema + labels + valores) listo para
// renderizar. Detecta legacy/empty schemas explícitamente.
//
// Importante: el `userId` se pasa a `resolveFormFromJson` para que los
// adapters lean valores actuales (ej: email del talent autenticado).
// Acá NO decidimos country gate — eso es responsabilidad del Server
// wrapper que llama primero a `resolveTalentAccess`.
//
// `serviceFilter` opcional: si está, filtra options de fields service_select
// por (countryId, cityId, status='published'). Útil cuando el form contiene
// un multiselect de servicios (ej: el field "Tipo de servicios" en
// onboarding step 3).
export async function getResolvedEmbeddableTalentForm(
  slug: string,
  cityId: string | null,
  locale: string,
  userId: string | null,
  serviceFilter?: ServiceFilter
): Promise<EmbedResolverResult<TalentEmbedMeta>> {
  const result = await getEmbeddableTalentForm(slug, cityId);
  if (!result.available) {
    return { available: false, reason: result.reason };
  }

  if (isLegacySchema(result.form.schema)) {
    return { available: false, reason: 'legacy-schema' };
  }

  const supabase = createClient();
  const formLabels = await loadTalentFormLabels(supabase, result.form.id, locale);

  const resolvedForm = await resolveFormFromJson({
    supabase,
    schemaJson: result.form.schema,
    userId,
    locale,
    formLabels,
    serviceFilter,
  });

  if (isEmptySchema(resolvedForm)) {
    return { available: false, reason: 'empty-schema' };
  }

  return {
    available: true,
    resolvedForm,
    meta: {
      formId: result.form.id,
      serviceId: result.service_id,
    },
  };
}
