'use server';

import { createClient } from '@/lib/supabase/server';
import { getTalentForm } from './get-talent-form';
import type { FormWithTranslations } from '@/shared/lib/forms/types';

export type TalentServiceFormData = {
  form: FormWithTranslations;
  existingData: Record<string, unknown> | null;
  existingFormId: string | null;
  selectedSubtypeIds: string[];
};

/**
 * Gets the talent form for a service + existing answers for the current talent.
 * Resolves the form by service_id and optional city_id (with fallback to General).
 */
export async function getTalentServiceForm(
  talentId: string,
  serviceId: string,
  countryId: string,
  cityId: string | null,
  locale: string
): Promise<TalentServiceFormData | null> {
  const supabase = createClient();

  // 1. Get the talent form for the talent's city (no fallback to General)
  const form = await getTalentForm(serviceId, cityId, false);
  if (!form) return null;

  // 2. Get existing talent_services data
  const { data: talentService } = await supabase
    .from('talent_services')
    .select('form_data, form_id')
    .eq('talent_id', talentId)
    .eq('service_id', serviceId)
    .eq('country_id', countryId)
    .single();

  // 3. Get existing selected subtypes
  const { data: subtypes } = await supabase
    .from('talent_service_subtypes')
    .select('subtype_id')
    .eq('talent_id', talentId);

  return {
    form,
    existingData: (talentService?.form_data as Record<string, unknown>) ?? null,
    existingFormId: talentService?.form_id ?? null,
    selectedSubtypeIds: (subtypes ?? []).map((s) => s.subtype_id),
  };
}
