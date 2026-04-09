'use server';

import { createClient } from '@/lib/supabase/server';
import type { ImportLookups, SurveyQuestionOption } from '../types';
import type { OrderLookups } from '../lib/transformers/transform-orders';

/**
 * Pre-load lookup maps for order imports.
 * Maps lowercase names → UUIDs for services, clients, talents, cities.
 */
/**
 * Pre-load city/country name → UUID maps for client/talent imports.
 */
export async function getImportLookups(locale: string): Promise<ImportLookups> {
  const supabase = createClient();

  const [citiesRes, countriesRes] = await Promise.all([
    supabase.from('city_translations').select('city_id, name').eq('locale', locale),
    supabase.from('country_translations').select('country_id, name').eq('locale', locale),
  ]);

  const citiesByName = new Map<string, string>();
  for (const c of citiesRes.data ?? []) {
    if (c.name) citiesByName.set(c.name.toLowerCase(), c.city_id);
  }

  const countriesByName = new Map<string, string>();
  for (const c of countriesRes.data ?? []) {
    if (c.name) countriesByName.set(c.name.toLowerCase(), c.country_id);
  }

  return { citiesByName, countriesByName };
}

/**
 * Load active survey questions with localized labels.
 */
export async function getSurveyQuestions(
  locale: string
): Promise<SurveyQuestionOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('survey_questions')
    .select('id, key, survey_question_translations!inner(label)')
    .eq('is_active', true)
    .eq('survey_question_translations.locale', locale)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((q) => {
    const translations = q.survey_question_translations as unknown as { label: string }[];
    return {
      id: q.id,
      key: q.key,
      label: translations[0]?.label ?? q.key,
    };
  });
}

export async function getOrderLookups(locale: string): Promise<OrderLookups> {
  const supabase = createClient();

  const [servicesRes, clientsRes, talentsRes, citiesRes, countriesRes] =
    await Promise.all([
      supabase
        .from('service_translations')
        .select('service_id, name')
        .eq('locale', locale),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('active_role', 'client'),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('active_role', 'talent'),
      supabase
        .from('city_translations')
        .select('city_id, name')
        .eq('locale', locale),
      supabase
        .from('countries')
        .select('id, code')
        .eq('code', 'PT')
        .single(),
    ]);

  const servicesByName = new Map<string, string>();
  for (const s of servicesRes.data ?? []) {
    if (s.name) servicesByName.set(s.name.toLowerCase(), s.service_id);
  }

  const clientsByName = new Map<string, string>();
  for (const c of clientsRes.data ?? []) {
    if (c.full_name) clientsByName.set(c.full_name.toLowerCase(), c.id);
  }

  const talentsByName = new Map<string, string>();
  for (const t of talentsRes.data ?? []) {
    if (t.full_name) talentsByName.set(t.full_name.toLowerCase(), t.id);
  }

  const citiesByName = new Map<string, string>();
  for (const c of citiesRes.data ?? []) {
    if (c.name) citiesByName.set(c.name.toLowerCase(), c.city_id);
  }

  return {
    servicesByName,
    clientsByName,
    talentsByName,
    citiesByName,
    countryIdForPT: countriesRes.data?.id ?? null,
  };
}
