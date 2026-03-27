'use server';

import { createClient } from '@/lib/supabase/server';
import type { FormTranslationData } from '@/shared/lib/forms/types';
import { normalizeSchema } from '@/shared/lib/forms/types';
import type { RegistrationFormWithTranslations } from '../types';

/**
 * Loads a registration form with all translations (JOIN query).
 * Finds by slug + city_id. Falls back to General if city variant not found.
 */
export async function getRegistrationForm(
  slug: string,
  cityId: string | null = null,
  fallback = true
): Promise<RegistrationFormWithTranslations | null> {
  const supabase = createClient();

  let query = supabase
    .from('registration_forms')
    .select('*, registration_form_translations(locale, labels, placeholders, option_labels)')
    .eq('slug', slug);

  if (cityId) {
    query = query.eq('city_id', cityId);
  } else {
    query = query.is('city_id', null);
  }

  const { data, error } = await query.order('version', { ascending: false }).limit(1).single();

  if (error || !data) {
    if (fallback && cityId) {
      return getRegistrationForm(slug, null, false);
    }
    return null;
  }

  const translations: Record<string, FormTranslationData> = {};
  const rawTrans = data.registration_form_translations as unknown as {
    locale: string;
    labels: Record<string, string>;
    placeholders: Record<string, string>;
    option_labels: Record<string, string> | null;
  }[];

  for (const t of rawTrans) {
    translations[t.locale] = {
      labels: t.labels ?? {},
      placeholders: t.placeholders ?? {},
      option_labels: t.option_labels ?? {},
    };
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    city_id: data.city_id,
    parent_id: data.parent_id,
    schema: normalizeSchema(data.schema),
    version: data.version,
    is_active: data.is_active,
    translations,
  };
}
