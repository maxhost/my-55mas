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
    const { data: services, error: svcError } = await supabase
      .from('services')
      .select('id, slug, i18n')
      .in('id', serviceIds);

    if (svcError) throw svcError;

    serviceNamesMap = new Map(
      (services ?? []).map((s) => {
        const i18n = (s.i18n ?? {}) as Record<string, Record<string, unknown>>;
        const name =
          (i18n[locale]?.name as string | undefined) ??
          (i18n.es?.name as string | undefined) ??
          s.slug;
        return [s.id, name];
      })
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

  // Query 4: countries/cities with i18n jsonb
  const { data: countries, error: countriesErr } = await supabase
    .from('countries')
    .select('id, i18n');

  if (countriesErr) throw countriesErr;

  const { data: cities, error: citiesErr } = await supabase
    .from('cities')
    .select('id, i18n');

  if (citiesErr) throw citiesErr;

  const earningsMap = buildEarningsMap(orders ?? []);
  const countryMap = buildNameMap(countries ?? [], locale);
  const cityMap = buildNameMap(cities ?? [], locale);

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
