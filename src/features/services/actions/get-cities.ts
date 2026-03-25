'use server';

import { createClient } from '@/lib/supabase/server';
import type { CityOption } from '../types';

export async function getCities(locale: string): Promise<CityOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('city_translations')
    .select('city_id, name, cities!inner (country_id, is_active)')
    .eq('locale', locale)
    .eq('cities.is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const city = row.cities as unknown as {
      country_id: string;
    };
    return {
      id: row.city_id,
      name: row.name,
      country_id: city.country_id,
    };
  });
}
