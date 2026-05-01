'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { CountryAdminOption } from './types';

export async function listActiveCountries(locale: string): Promise<CountryAdminOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('countries')
    .select('id, code, i18n')
    .eq('is_active', true);

  if (error) throw error;

  type I18nRecord = Record<string, Record<string, unknown>> | null;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      code: row.code,
      name: localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
