'use server';

import { createClient } from '@/lib/supabase/server';
import type { CountryOption } from '../types';

export async function getCountries(locale: string): Promise<CountryOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('country_translations')
    .select('country_id, name, countries!inner (code, currency, is_active)')
    .eq('locale', locale)
    .eq('countries.is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const country = row.countries as unknown as {
      code: string;
      currency: string;
    };
    return {
      id: row.country_id,
      code: country.code,
      name: row.name,
      currency: country.currency,
    };
  });
}
