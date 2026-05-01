'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { CountryOption, CityOption } from '../types';

type I18nRecord = Record<string, Record<string, unknown>> | null;

export async function getCountryOptions(locale: string): Promise<CountryOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('countries')
    .select('id, i18n')
    .eq('is_active', true);

  if (error) throw error;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      name: localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCityOptions(locale: string): Promise<CityOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('cities')
    .select('id, country_id, i18n')
    .eq('is_active', true);

  if (error) throw error;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      name: localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.id,
      country_id: row.country_id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
