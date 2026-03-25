'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  ServiceDetail,
  ServiceTranslationDetail,
  ServiceCountryDetail,
  FaqItem,
} from '../types';

export async function getService(id: string): Promise<ServiceDetail | null> {
  const supabase = createClient();

  // Fetch service base data
  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !service) return null;

  // Fetch all translations
  const { data: rawTranslations } = await supabase
    .from('service_translations')
    .select('*')
    .eq('service_id', id);

  const translations: ServiceTranslationDetail[] = (
    rawTranslations ?? []
  ).map((t) => ({
    locale: t.locale,
    name: t.name,
    description: t.description ?? '',
    includes: t.includes ?? '',
    hero_title: t.hero_title ?? '',
    hero_subtitle: t.hero_subtitle ?? '',
    benefits: Array.isArray(t.benefits) ? (t.benefits as string[]) : [],
    guarantees: Array.isArray(t.guarantees) ? (t.guarantees as string[]) : [],
    faqs: Array.isArray(t.faqs) ? (t.faqs as FaqItem[]) : [],
  }));

  // Fetch country pricing with country details
  const { data: rawCountries } = await supabase
    .from('service_countries')
    .select(
      `
      service_id,
      country_id,
      base_price,
      is_active,
      countries (
        code,
        currency
      )
    `
    )
    .eq('service_id', id);

  // Fetch country names (in 'es' as admin default)
  const countryIds = (rawCountries ?? []).map((c) => c.country_id);
  let countryNameMap: Record<string, string> = {};

  if (countryIds.length > 0) {
    const { data: countryNames } = await supabase
      .from('country_translations')
      .select('country_id, name')
      .eq('locale', 'es')
      .in('country_id', countryIds);

    countryNameMap = Object.fromEntries(
      (countryNames ?? []).map((c) => [c.country_id, c.name])
    );
  }

  const countries: ServiceCountryDetail[] = (rawCountries ?? []).map((c) => {
    const country = c.countries as unknown as {
      code: string;
      currency: string;
    };
    return {
      service_id: c.service_id,
      country_id: c.country_id,
      base_price: c.base_price,
      is_active: c.is_active,
      country_name: countryNameMap[c.country_id] ?? country.code,
      currency: country.currency,
      country_code: country.code,
    };
  });

  return { ...service, translations, countries };
}
