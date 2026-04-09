'use server';

import { createClient } from '@/lib/supabase/server';
import type { ImportLookups, SurveyQuestionOption, ServiceOption, SubtypeGroupOption } from '../types';
import type { OrderLookups } from '../lib/transformers/transform-orders';

/**
 * Pre-load lookup maps for order imports.
 * Maps lowercase names → UUIDs for services, clients, talents, cities.
 */
/**
 * Pre-load city/country name → UUID maps for client/talent imports.
 */
// Map CSV locale → country code for default country assignment
const LOCALE_TO_COUNTRY: Record<string, string> = {
  es: 'ES', en: 'ES', pt: 'PT', fr: 'FR', ca: 'ES',
};

export async function getImportLookups(locale: string): Promise<ImportLookups> {
  const supabase = createClient();

  const countryCode = LOCALE_TO_COUNTRY[locale] ?? 'ES';

  const [citiesRes, countriesRes, defaultCountryRes] = await Promise.all([
    supabase.from('city_translations').select('city_id, name').eq('locale', locale),
    supabase.from('country_translations').select('country_id, name').eq('locale', locale),
    supabase.from('countries').select('id').eq('code', countryCode).single(),
  ]);

  const citiesByName = new Map<string, string>();
  for (const c of citiesRes.data ?? []) {
    if (c.name) citiesByName.set(c.name.toLowerCase(), c.city_id);
  }

  const countriesByName = new Map<string, string>();
  for (const c of countriesRes.data ?? []) {
    if (c.name) countriesByName.set(c.name.toLowerCase(), c.country_id);
  }

  return {
    citiesByName,
    countriesByName,
    defaultCountryId: defaultCountryRes.data?.id ?? null,
  };
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

/**
 * Load services for the talent import column mapper dropdown.
 */
export async function getServiceOptions(locale: string): Promise<ServiceOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('service_translations')
    .select('service_id, name, services!inner(slug)')
    .eq('locale', locale)
    .order('name', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const svc = row.services as unknown as { slug: string };
    return { id: row.service_id, slug: svc.slug, name: row.name };
  });
}

/**
 * Load subtype groups with their items for the talent import column mapper.
 */
export async function getSubtypeGroupOptions(locale: string): Promise<SubtypeGroupOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('service_subtype_groups')
    .select(`
      id,
      services!inner(slug),
      service_subtype_group_translations!inner(name),
      service_subtypes(id, service_subtype_translations!inner(name))
    `)
    .eq('service_subtype_group_translations.locale', locale)
    .eq('service_subtypes.service_subtype_translations.locale', locale)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((g) => {
    const svc = g.services as unknown as { slug: string };
    const trans = g.service_subtype_group_translations as unknown as { name: string }[];
    const subtypes = g.service_subtypes as unknown as { id: string; service_subtype_translations: { name: string }[] }[];

    return {
      id: g.id,
      serviceSlug: svc.slug,
      groupName: trans[0]?.name ?? g.id,
      items: subtypes.map((st) => ({
        id: st.id,
        name: st.service_subtype_translations[0]?.name ?? st.id,
      })),
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
