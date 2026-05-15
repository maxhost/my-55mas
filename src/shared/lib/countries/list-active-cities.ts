'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';

export type CityOption = {
  id: string;
  countryId: string;
  name: string;
};

export async function listActiveCities(
  locale: string,
): Promise<CityOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('cities')
    .select('id, country_id, slug, i18n')
    .eq('is_active', true);

  if (error) throw error;

  type I18nRecord = Record<string, Record<string, unknown>> | null;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      countryId: row.country_id,
      name:
        localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.slug,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
