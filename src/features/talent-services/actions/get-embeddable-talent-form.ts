'use server';

import { createClient } from '@/lib/supabase/server';
import type { EmbedReason } from '@/shared/lib/embed/types';
import { devWarn } from '@/shared/lib/embed/dev-warn';
import { getTalentForm } from './get-talent-form';
import type { FormWithTranslations } from '@/shared/lib/forms/types';

// Reasons que este loader puede devolver. Subset de EmbedReason.
export type TalentFormEmbedReason = Extract<
  EmbedReason,
  'unknown-slug' | 'service-not-active' | 'no-active-form'
>;

export type EmbeddableTalentFormResult =
  | {
      available: true;
      form: FormWithTranslations;
      service_id: string;
    }
  | { available: false; reason: TalentFormEmbedReason };

// Resuelve un talent form para embed por slug del servicio.
//
// Pasos:
// 1. services WHERE slug = ? → resuelve service_id. Detecta status:
//    - row null → unknown-slug
//    - status !== 'active' → service-not-active
// 2. getTalentForm(service_id, cityId, fallback=true) → form (con
//    fallback a city=null si la variant city no existe).
//    - null → no-active-form (city/general no tiene form activo)
//
// Dev-warn si talent_forms tiene >1 row activa para el tuple.
export async function getEmbeddableTalentForm(
  slug: string,
  cityId: string | null
): Promise<EmbeddableTalentFormResult> {
  const supabase = createClient();

  // 1. Service lookup — fetch sin filtro para distinguir unknown vs inactive.
  const { data: service } = await supabase
    .from('services')
    .select('id, status')
    .eq('slug', slug)
    .maybeSingle();

  if (!service) return { available: false, reason: 'unknown-slug' };
  if (service.status !== 'active') {
    return { available: false, reason: 'service-not-active' };
  }

  // 2. Form lookup con fallback. getTalentForm ya hace ORDER BY version DESC
  // LIMIT 1 — defensa contra duplicate active rows.
  const form = await getTalentForm(service.id, cityId, true, true);
  if (!form) return { available: false, reason: 'no-active-form' };

  // Defensa: si hay >1 row activa para (service_id, city_id), warn.
  // Re-query no-fallback para detectar duplicates exclusivos del tuple.
  if (form.city_id === cityId) {
    const { data: dupes } = await supabase
      .from('talent_forms')
      .select('id')
      .eq('service_id', service.id)
      .eq('is_active', true)
      .filter('city_id', cityId === null ? 'is' : 'eq', cityId);
    if (dupes && dupes.length > 1) {
      devWarn('getEmbeddableTalentForm', {
        warning: 'multiple-active-rows',
        service_id: service.id,
        city_id: cityId,
        count: dupes.length,
      });
    }
  }

  return { available: true, form, service_id: service.id };
}
