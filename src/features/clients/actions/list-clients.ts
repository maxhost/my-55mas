'use server';

import { createClient } from '@/lib/supabase/server';
import { buildNameMap } from './list-clients-helpers';
import type { ClientListItem } from '../types';

type ListClientsParams = {
  locale: string;
};

export async function listClients({
  locale,
}: ListClientsParams): Promise<ClientListItem[]> {
  const supabase = createClient();

  // Query 1: client profiles + base profile
  const { data: clients, error: clientsError } = await supabase
    .from('client_profiles')
    .select(
      'id, user_id, company_name, status, created_at, profiles!inner(full_name, preferred_country, preferred_city)'
    )
    .order('created_at', { ascending: false });

  if (clientsError) throw clientsError;
  if (!clients || clients.length === 0) return [];

  // Query 2: localized country names
  const { data: countries, error: countriesError } = await supabase
    .from('countries_localized')
    .select('id, name')
    .eq('locale', locale);

  if (countriesError) throw countriesError;

  // Query 3: localized city names
  const { data: cities, error: citiesError } = await supabase
    .from('cities_localized')
    .select('id, name')
    .eq('locale', locale);

  if (citiesError) throw citiesError;

  const countryMap = buildNameMap(countries ?? []);
  const cityMap = buildNameMap(cities ?? []);

  return clients.map((c) => {
    const profile = c.profiles as unknown as {
      full_name: string | null;
      preferred_country: string | null;
      preferred_city: string | null;
    };
    return {
      id: c.id,
      user_id: c.user_id,
      full_name: profile.full_name,
      country_name: profile.preferred_country
        ? countryMap.get(profile.preferred_country) ?? null
        : null,
      country_id: profile.preferred_country,
      city_name: profile.preferred_city
        ? cityMap.get(profile.preferred_city) ?? null
        : null,
      city_id: profile.preferred_city,
      company_name: c.company_name,
      status: c.status as ClientListItem['status'],
      created_at: c.created_at,
    };
  });
}
