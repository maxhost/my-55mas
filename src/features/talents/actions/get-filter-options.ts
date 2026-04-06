'use server';

import { createClient } from '@/lib/supabase/server';
import type { CountryOption, CityOption } from '../types';

export async function getCountryOptions(
  locale: string
): Promise<CountryOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('country_translations')
    .select('country_id, name, countries!inner(is_active)')
    .eq('locale', locale)
    .eq('countries.is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.country_id,
    name: row.name,
  }));
}

export async function getCityOptions(
  locale: string
): Promise<CityOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('city_translations')
    .select('city_id, name, cities!inner(country_id, is_active)')
    .eq('locale', locale)
    .eq('cities.is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const city = row.cities as unknown as { country_id: string };
    return {
      id: row.city_id,
      name: row.name,
      country_id: city.country_id,
    };
  });
}
