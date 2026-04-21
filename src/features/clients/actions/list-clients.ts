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

  // Query 1: client profiles + base profile (paginated to bypass PostgREST 1000-row cap)
  const PAGE_SIZE = 1000;
  type ClientRow = {
    id: string;
    user_id: string;
    company_name: string | null;
    status: string | null;
    created_at: string;
    profiles: { full_name: string | null; preferred_country: string | null; preferred_city: string | null };
  };
  const clients: ClientRow[] = [];
  let from = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from('client_profiles')
      .select(
        'id, user_id, company_name, status, created_at, profiles!inner(full_name, preferred_country, preferred_city)'
      )
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!page || page.length === 0) break;
    clients.push(...(page as unknown as ClientRow[]));
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  if (clients.length === 0) return [];

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

  return clients.map((c) => ({
    id: c.id,
    user_id: c.user_id,
    full_name: c.profiles.full_name,
    country_name: c.profiles.preferred_country
      ? countryMap.get(c.profiles.preferred_country) ?? null
      : null,
    country_id: c.profiles.preferred_country,
    city_name: c.profiles.preferred_city
      ? cityMap.get(c.profiles.preferred_city) ?? null
      : null,
    city_id: c.profiles.preferred_city,
    company_name: c.company_name,
    status: c.status as ClientListItem['status'],
    created_at: c.created_at,
  }));
}
