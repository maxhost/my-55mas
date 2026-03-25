'use server';

import { createClient } from '@/lib/supabase/server';
import {
  normalizeSchema,
  type FormWithTranslations,
  type FormTranslationData,
} from '../types';

export async function getForm(
  serviceId: string,
  countryId: string | null = null,
  fallback = true
): Promise<FormWithTranslations | null> {
  const supabase = createClient();

  // Try specific country first, then fallback to default (null)
  let query = supabase
    .from('service_forms')
    .select('*')
    .eq('service_id', serviceId)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1);

  if (countryId) {
    query = query.eq('country_id', countryId);
  } else {
    query = query.is('country_id', null);
  }

  const { data: forms, error } = await query;

  if (error) throw error;

  // Fallback to default if country-specific not found
  if ((!forms || forms.length === 0) && countryId && fallback) {
    return getForm(serviceId, null, true);
  }

  if (!forms || forms.length === 0) return null;

  const form = forms[0];

  // Fetch translations
  const { data: rawTranslations } = await supabase
    .from('service_form_translations')
    .select('*')
    .eq('form_id', form.id);

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
    country_id: form.country_id,
    schema: normalizeSchema(form.schema),
    version: form.version,
    is_active: form.is_active,
    translations,
  };
}
