'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';

export type PublishedServiceOption = {
  id: string;
  slug: string;
  name: string;
};

export async function listPublishedServices(locale: string): Promise<PublishedServiceOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('services')
    .select('id, slug, i18n')
    .eq('status', 'published');

  if (error) throw error;

  type I18nRecord = Record<string, Record<string, unknown>> | null;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.slug,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
