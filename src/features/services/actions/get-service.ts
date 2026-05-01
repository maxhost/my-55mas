'use server';

import { createClient } from '@/lib/supabase/server';
import { localize, localizedField } from '@/shared/lib/i18n/localize';
import type {
  ServiceDetail,
  ServiceTranslationDetail,
  ServiceCountryDetail,
  ServiceCityDetail,
  FaqItem,
} from '../types';

type ServiceI18nEntry = {
  name?: string;
  description?: string | null;
  includes?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  benefits?: unknown;
  guarantees?: unknown;
  faqs?: unknown;
};

function toTranslationDetail(locale: string, entry: ServiceI18nEntry): ServiceTranslationDetail {
  return {
    locale,
    name: entry.name ?? '',
    description: entry.description ?? '',
    includes: entry.includes ?? '',
    hero_title: entry.hero_title ?? '',
    hero_subtitle: entry.hero_subtitle ?? '',
    benefits: Array.isArray(entry.benefits) ? (entry.benefits as string[]) : [],
    guarantees: Array.isArray(entry.guarantees) ? (entry.guarantees as string[]) : [],
    faqs: Array.isArray(entry.faqs) ? (entry.faqs as FaqItem[]) : [],
  };
}

export async function getService(id: string): Promise<ServiceDetail | null> {
  const supabase = createClient();

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !service) return null;

  const i18n = (service.i18n ?? {}) as Record<string, ServiceI18nEntry>;
  const translations: ServiceTranslationDetail[] = Object.entries(i18n).map(
    ([locale, entry]) => toTranslationDetail(locale, entry)
  );

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
        currency,
        i18n
      )
    `
    )
    .eq('service_id', id);

  const countries: ServiceCountryDetail[] = (rawCountries ?? []).map((c) => {
    const country = c.countries as unknown as {
      code: string;
      currency: string;
      i18n: Record<string, Record<string, unknown>> | null;
    };
    const countryName = localizedField(country.i18n, 'es', 'name') ?? country.code;
    return {
      service_id: c.service_id,
      country_id: c.country_id,
      base_price: c.base_price,
      is_active: c.is_active,
      country_name: countryName,
      currency: country.currency,
      country_code: country.code,
    };
  });

  const { data: rawCities } = await supabase
    .from('service_cities')
    .select('service_id, city_id, base_price, is_active, cities (country_id, i18n)')
    .eq('service_id', id);

  const cities: ServiceCityDetail[] = (rawCities ?? []).map((c) => {
    const city = c.cities as unknown as {
      country_id: string;
      i18n: Record<string, Record<string, unknown>> | null;
    };
    const cityName = localizedField(city.i18n, 'es', 'name') ?? c.city_id;
    return {
      service_id: c.service_id,
      city_id: c.city_id,
      base_price: c.base_price,
      is_active: c.is_active,
      city_name: cityName,
      country_id: city.country_id,
    };
  });

  return { ...service, translations, countries, cities };
}
