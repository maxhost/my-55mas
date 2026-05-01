'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { CityOption, ServiceOption } from '../types';

type I18nRecord = Record<string, Record<string, unknown>> | null;

export async function getCitiesByCountry(
  countryId: string,
  locale: string,
): Promise<CityOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('cities')
    .select('id, country_id, i18n')
    .eq('country_id', countryId)
    .eq('is_active', true);

  if (error) throw error;

  return (data ?? [])
    .map((c) => ({
      id: c.id,
      country_id: c.country_id,
      name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? c.id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getServicesByLocation(
  countryId: string,
  cityId: string | null,
  locale: string,
): Promise<ServiceOption[]> {
  const supabase = createClient();

  // 1. Services activos en el país
  const { data: countryServices } = await supabase
    .from('service_countries')
    .select('service_id')
    .eq('country_id', countryId)
    .eq('is_active', true);

  const countryServiceIds = (countryServices ?? []).map((s) => s.service_id);
  if (countryServiceIds.length === 0) return [];

  // 2. Si city_id provista, filtrar a service_cities
  let allowedServiceIds = countryServiceIds;
  if (cityId) {
    const { data: cityServices } = await supabase
      .from('service_cities')
      .select('service_id')
      .eq('city_id', cityId)
      .eq('is_active', true)
      .in('service_id', countryServiceIds);
    allowedServiceIds = (cityServices ?? []).map((s) => s.service_id);
    if (allowedServiceIds.length === 0) return [];
  }

  // 3. Cargar service rows con i18n
  const { data: services, error } = await supabase
    .from('services')
    .select('id, slug, status, i18n')
    .in('id', allowedServiceIds)
    .eq('status', 'published');

  if (error) throw error;

  return (services ?? [])
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      name: localizedField(s.i18n as I18nRecord, locale, 'name') ?? s.slug,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
