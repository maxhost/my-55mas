'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type { TalentTagOption } from '../types';

export async function getTalentTagOptions(locale: string): Promise<TalentTagOption[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('talent_tags')
    .select('id, slug, i18n')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  return (data ?? []).map((t) => ({
    id: t.id,
    name: localizedField(t.i18n as I18nRecord, locale, 'name') ?? t.slug,
  }));
}
