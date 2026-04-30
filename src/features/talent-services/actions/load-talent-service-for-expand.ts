'use server';

import { createClient } from '@/lib/supabase/server';
import { getResolvedEmbeddableTalentForm } from './get-resolved-embeddable-talent-form';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';
import type { EmbedReason } from '@/shared/lib/embed/types';

type Input = {
  slug: string;
};

export type TalentServiceExpandResult =
  | {
      ok: true;
      resolvedForm: ResolvedForm;
      formId: string;
      serviceId: string;
    }
  | {
      ok: false;
      reason: EmbedReason | 'not-authenticated' | 'no-talent-profile';
    };

// Lazy fetch del resolved form de UN servicio cuando el user expande un
// item del acordeón. Identidad + cityId resueltos server-side desde la
// sesión del talent.
//
// Reusa `getResolvedEmbeddableTalentForm` que ya hace toda la lógica de
// resolución por slug + cityId + locale + filtrado country+city.
export async function loadTalentServiceForExpand(
  input: Input,
  locale: string
): Promise<TalentServiceExpandResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: 'not-authenticated' };

  const { data: profile } = await supabase
    .from('talent_profiles')
    .select('country_id, city_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) return { ok: false, reason: 'no-talent-profile' };

  const result = await getResolvedEmbeddableTalentForm(
    input.slug,
    profile.city_id,
    locale,
    user.id,
    profile.country_id
      ? { countryId: profile.country_id, cityId: profile.city_id }
      : undefined
  );

  if (!result.available) {
    return { ok: false, reason: result.reason };
  }

  return {
    ok: true,
    resolvedForm: result.resolvedForm,
    formId: result.meta.formId,
    serviceId: result.meta.serviceId,
  };
}
