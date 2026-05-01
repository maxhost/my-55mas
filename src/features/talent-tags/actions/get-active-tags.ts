'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';

export type ActiveTalentTagOption = {
  id: string;
  name: string;
};

type I18nRecord = Record<string, Record<string, unknown>> | null;

export async function getActiveTags(locale: string): Promise<ActiveTalentTagOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('talent_tags')
    .select('id, slug, sort_order, i18n')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.slug,
  }));
}
