'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { CityOption } from '../types';

export async function getCities(locale: string): Promise<CityOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('cities')
    .select('id, country_id, i18n')
    .eq('is_active', true);

  if (error) throw error;

  const i18nRecord = (i: unknown) =>
    (i ?? {}) as Record<string, Record<string, unknown>>;

  const options = (data ?? []).map((row) => ({
    id: row.id,
    country_id: row.country_id,
    name: localizedField(i18nRecord(row.i18n), locale, 'name') ?? row.id,
  }));

  return options.sort((a, b) => a.name.localeCompare(b.name));
}
