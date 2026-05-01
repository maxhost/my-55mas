'use server';

import { createClient } from '@/lib/supabase/server';
import { getSpokenLanguageAliases } from '@/shared/lib/spoken-languages/actions';
import { localizedField } from '@/shared/lib/i18n/localize';
import type {
  ImportLookups,
  ServiceOption,
  SubtypeGroupOption,
  SurveyQuestionOption,
  TalentTagOption,
} from '../types';
import { normalizeName } from '../lib/transformers/transform-orders';
import type { OrderLookups } from '../lib/transformers/transform-orders';

const LOCALE_TO_COUNTRY: Record<string, string> = {
  es: 'ES', en: 'ES', pt: 'PT', fr: 'FR', ca: 'ES',
};

type I18nRecord = Record<string, Record<string, unknown>> | null;

function readName(i18n: I18nRecord, locale: string): string | null {
  return localizedField(i18n, locale, 'name');
}

export async function getImportLookups(locale: string): Promise<ImportLookups> {
  const supabase = createClient();

  const countryCode = LOCALE_TO_COUNTRY[locale] ?? 'ES';

  const [citiesRes, countriesRes, defaultCountryRes, tagsRes, spokenLanguageAliases] =
    await Promise.all([
      supabase.from('cities').select('id, i18n'),
      supabase.from('countries').select('id, i18n'),
      supabase.from('countries').select('id').eq('code', countryCode).single(),
      supabase.from('talent_tags').select('id, slug, i18n').eq('is_active', true),
      getSpokenLanguageAliases(),
    ]);

  const citiesByName = new Map<string, string>();
  for (const c of citiesRes.data ?? []) {
    const name = readName(c.i18n as I18nRecord, locale);
    if (name) citiesByName.set(name.toLowerCase(), c.id);
  }

  const countriesByName = new Map<string, string>();
  for (const c of countriesRes.data ?? []) {
    const name = readName(c.i18n as I18nRecord, locale);
    if (name) countriesByName.set(name.toLowerCase(), c.id);
  }

  // Build tagIdsByName map. All translations are added (case-insensitive) so a
  // CSV in any locale matches the same tag. Slug always added as fallback.
  const tagIdsByName = new Map<string, string>();
  for (const tag of tagsRes.data ?? []) {
    const i18n = (tag.i18n ?? {}) as Record<string, { name?: string } | null>;
    let matched = false;
    for (const entry of Object.values(i18n)) {
      const n = entry?.name;
      if (typeof n === 'string' && n) {
        tagIdsByName.set(n.toLowerCase(), tag.id);
        matched = true;
      }
    }
    if (!matched && tag.slug) tagIdsByName.set(tag.slug.toLowerCase(), tag.id);
  }

  return {
    citiesByName,
    countriesByName,
    defaultCountryId: defaultCountryRes.data?.id ?? null,
    tagIdsByName,
    spokenLanguageAliases,
  };
}

export async function getTalentTagOptions(locale: string): Promise<TalentTagOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('talent_tags')
    .select('id, slug, i18n')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((tag) => {
    const name = readName(tag.i18n as I18nRecord, locale) ?? tag.slug;
    return { id: tag.id, name };
  });
}

export async function getSurveyQuestions(locale: string): Promise<SurveyQuestionOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('survey_questions')
    .select('id, key, i18n')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((q) => {
    const label = localizedField(q.i18n as I18nRecord, locale, 'label') ?? q.key;
    return { id: q.id, key: q.key, label };
  });
}

export async function getServiceOptions(locale: string): Promise<ServiceOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('services')
    .select('id, slug, i18n')
    .order('slug', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((svc) => {
    const name = readName(svc.i18n as I18nRecord, locale) ?? svc.slug;
    return { id: svc.id, slug: svc.slug, name };
  });
}

export async function getSubtypeGroupOptions(locale: string): Promise<SubtypeGroupOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('service_subtype_groups')
    .select(`
      id,
      i18n,
      service_subtypes(id, i18n),
      service_subtype_group_assignments(services(slug))
    `)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((g) => {
    const subtypes = (g.service_subtypes ?? []) as unknown as {
      id: string;
      i18n: I18nRecord;
    }[];
    const assignments = (g.service_subtype_group_assignments ?? []) as unknown as {
      services: { slug: string } | null;
    }[];
    const serviceSlugs = assignments
      .map((a) => a.services?.slug)
      .filter((s): s is string => typeof s === 'string');

    return {
      id: g.id,
      serviceSlugs,
      groupName: readName(g.i18n as I18nRecord, locale) ?? g.id,
      items: subtypes.map((st) => ({
        id: st.id,
        name: readName(st.i18n, locale) ?? st.id,
      })),
    };
  });
}

export async function getOrderLookups(locale: string): Promise<OrderLookups> {
  const supabase = createClient();
  const countryCode = LOCALE_TO_COUNTRY[locale] ?? 'ES';

  const [servicesRes, clientsRes, talentsRes, citiesRes, countriesRes, staffRes] =
    await Promise.all([
      supabase.from('services').select('id, i18n'),
      supabase.from('profiles').select('id, full_name').eq('active_role', 'client'),
      supabase.from('profiles').select('id, full_name').eq('active_role', 'talent'),
      supabase.from('cities').select('id, i18n'),
      supabase.from('countries').select('id, code').eq('code', countryCode).single(),
      supabase.from('staff_profiles').select('id, first_name, last_name'),
    ]);

  const servicesByName = new Map<string, string>();
  for (const s of servicesRes.data ?? []) {
    const name = readName(s.i18n as I18nRecord, locale);
    if (name) servicesByName.set(normalizeName(name), s.id);
  }

  const clientsByName = new Map<string, string>();
  for (const c of clientsRes.data ?? []) {
    if (c.full_name) clientsByName.set(normalizeName(c.full_name), c.id);
  }

  const talentsByName = new Map<string, string>();
  for (const t of talentsRes.data ?? []) {
    if (t.full_name) talentsByName.set(normalizeName(t.full_name), t.id);
  }

  const citiesByName = new Map<string, string>();
  for (const c of citiesRes.data ?? []) {
    const name = readName(c.i18n as I18nRecord, locale);
    if (name) citiesByName.set(normalizeName(name), c.id);
  }

  const staffByName = new Map<string, string>();
  for (const s of staffRes.data ?? []) {
    const fullName = `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim();
    if (fullName) staffByName.set(normalizeName(fullName), s.id);
  }

  return {
    servicesByName,
    clientsByName,
    talentsByName,
    citiesByName,
    staffByName,
    defaultCountryId: countriesRes.data?.id ?? null,
  };
}
