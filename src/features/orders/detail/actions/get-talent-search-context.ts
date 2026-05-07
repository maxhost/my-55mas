'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type {
  CityRef,
  CountryRef,
  ServiceOption,
  TalentSearchFilters,
} from '../types';
import { getServiceOptions } from './get-service-options';

export type TalentSearchContext = {
  countries: CountryRef[];
  cities: CityRef[];
  services: ServiceOption[];
  /**
   * Pre-filled filters from the order: country/city/postal/service that the
   * order requires. Admin can clear them with the "Limpiar filtros" button.
   */
  defaultFilters: TalentSearchFilters;
};

/**
 * Pre-loads everything the talent search modal needs so it can render
 * instantly when opened. Called from the order detail page in parallel
 * with the rest of the data.
 */
export async function getTalentSearchContext(
  orderId: string,
  locale: string,
): Promise<TalentSearchContext> {
  const supabase = createClient();

  const [orderRes, countriesRes, citiesRes, services] = await Promise.all([
    supabase
      .from('orders')
      .select('country_id, service_id, service_city_id, service_postal_code')
      .eq('id', orderId)
      .maybeSingle(),
    supabase.from('countries').select('id, code, i18n').eq('is_active', true),
    supabase.from('cities').select('id, country_id, i18n'),
    getServiceOptions(locale),
  ]);

  const countries: CountryRef[] = (countriesRes.data ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? c.code,
  }));
  countries.sort((a, b) => a.name.localeCompare(b.name));

  const cities: CityRef[] = (citiesRes.data ?? []).map((c) => ({
    id: c.id,
    country_id: c.country_id,
    name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? '',
  }));
  cities.sort((a, b) => a.name.localeCompare(b.name));

  const order = orderRes.data;
  const defaultFilters: TalentSearchFilters = {
    countryId: order?.country_id ?? null,
    cityId: order?.service_city_id ?? null,
    postalCode: order?.service_postal_code ?? '',
    serviceId: order?.service_id ?? null,
    query: '',
  };

  return { countries, cities, services, defaultFilters };
}
