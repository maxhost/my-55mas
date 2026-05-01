'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { CountryOption } from '../types';

export async function getCountries(locale: string): Promise<CountryOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('countries')
    .select('id, code, currency, i18n')
    .eq('is_active', true);

  if (error) throw error;

  const i18nRecord = (i: unknown) =>
    (i ?? {}) as Record<string, Record<string, unknown>>;

  const options = (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    name: localizedField(i18nRecord(row.i18n), locale, 'name') ?? row.code,
    currency: row.currency,
  }));

  return options.sort((a, b) => a.name.localeCompare(b.name));
}
