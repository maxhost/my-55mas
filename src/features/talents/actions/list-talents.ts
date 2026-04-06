'use server';

import { createClient } from '@/lib/supabase/server';
import { buildServicesMap, buildEarningsMap, buildNameMap } from './list-talents-helpers';
import type { TalentListItem } from '../types';

type ListTalentsParams = {
  locale: string;
};

export async function listTalents({
  locale,
}: ListTalentsParams): Promise<TalentListItem[]> {
  const supabase = createClient();

  // Query 1: talent profiles + base profile (explicit FK: user_id → profiles)
  const { data: talents, error: talentsError } = await supabase
    .from('talent_profiles')
    .select(
      'id, user_id, status, country_id, city_id, created_at, profiles!talent_profiles_user_id_fkey(full_name)'
    )
    .order('created_at', { ascending: false });

  if (talentsError) throw talentsError;
  if (!talents || talents.length === 0) return [];

  const talentIds = talents.map((t) => t.id);

  // Query 2: service names per talent
  const { data: talentServices, error: servicesError } = await supabase
    .from('talent_services')
    .select('talent_id, service_id')
    .in('talent_id', talentIds);

  if (servicesError) throw servicesError;

  const serviceIds = Array.from(
    new Set((talentServices ?? []).map((ts) => ts.service_id))
  );

  let serviceNamesMap = new Map<string, string>();
  if (serviceIds.length > 0) {
    const { data: translations, error: transError } = await supabase
      .from('service_translations')
      .select('service_id, name')
      .in('service_id', serviceIds)
      .eq('locale', locale);

    if (transError) throw transError;

    serviceNamesMap = new Map(
      (translations ?? []).map((t) => [t.service_id, t.name])
    );
  }

  const servicesMap = buildServicesMap(
    (talentServices ?? []).map((ts) => ({
      talent_id: ts.talent_id,
      service_name: serviceNamesMap.get(ts.service_id) ?? null,
    }))
  );

  // Query 3: total earned in EUR from completed orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('talent_id, price_total')
    .in('talent_id', talentIds)
    .eq('status', 'completado')
    .eq('currency', 'EUR');

  if (ordersError) throw ordersError;

  // Query 4: localized country/city names
  const { data: countries, error: countriesErr } = await supabase
    .from('countries_localized')
    .select('id, name')
    .eq('locale', locale);

  if (countriesErr) throw countriesErr;

  const { data: cities, error: citiesErr } = await supabase
    .from('cities_localized')
    .select('id, name')
    .eq('locale', locale);

  if (citiesErr) throw citiesErr;

  const earningsMap = buildEarningsMap(orders ?? []);
  const countryMap = buildNameMap(countries ?? []);
  const cityMap = buildNameMap(cities ?? []);

  return talents.map((t) => {
    const profile = t.profiles as unknown as { full_name: string | null };
    return {
      id: t.id,
      user_id: t.user_id,
      full_name: profile.full_name,
      country_id: t.country_id,
      country_name: t.country_id ? countryMap.get(t.country_id) ?? null : null,
      city_id: t.city_id,
      city_name: t.city_id ? cityMap.get(t.city_id) ?? null : null,
      services: servicesMap.get(t.id) ?? [],
      total_earned_eur: earningsMap.get(t.id) ?? 0,
      status: t.status as TalentListItem['status'],
      created_at: t.created_at,
    };
  });
}
