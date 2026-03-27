'use server';

import { createClient } from '@/lib/supabase/server';
import {
  normalizeSchema,
  type FormWithTranslations,
  type FormTranslationData,
} from '@/shared/lib/forms/types';

export async function getTalentForm(
  serviceId: string,
  cityId: string | null = null,
  fallback = true,
  activeOnly = true
): Promise<FormWithTranslations | null> {
  const supabase = createClient();

  // Single query with JOIN — eliminates sequential translations roundtrip
  let query = supabase
    .from('talent_forms')
    .select('*, talent_form_translations(locale, labels, placeholders, option_labels)')
    .eq('service_id', serviceId)
    .order('version', { ascending: false })
    .limit(1);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  if (cityId) {
    query = query.eq('city_id', cityId);
  } else {
    query = query.is('city_id', null);
  }

  const { data: forms, error } = await query;

  if (error) throw error;

  // Fallback to default if city-specific not found
  if ((!forms || forms.length === 0) && cityId && fallback) {
    return getTalentForm(serviceId, null, true, activeOnly);
  }

  if (!forms || forms.length === 0) return null;

  const form = forms[0];
  const rawTranslations = form.talent_form_translations as unknown as {
    locale: string;
    labels: Record<string, string>;
    placeholders: Record<string, string> | null;
    option_labels: Record<string, string> | null;
  }[];

  const translations: Record<string, FormTranslationData> = {};
  for (const t of rawTranslations ?? []) {
    translations[t.locale] = {
      labels: (t.labels as Record<string, string>) ?? {},
      placeholders: (t.placeholders as Record<string, string>) ?? {},
      option_labels: (t.option_labels as Record<string, string>) ?? {},
    };
  }

  return {
    id: form.id,
    service_id: form.service_id,
    city_id: form.city_id,
    schema: normalizeSchema(form.schema),
    version: form.version,
    is_active: form.is_active,
    translations,
  };
}
