'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { SpokenLanguageAliasMap, SpokenLanguageOption } from './types';

type I18nRecord = Record<string, Record<string, unknown>> | null;

export async function getSpokenLanguageOptions(
  locale: string
): Promise<SpokenLanguageOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('spoken_languages')
    .select('code, sort_order, i18n')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const label = localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.code;
    return { code: row.code, label, sortOrder: row.sort_order };
  });
}

export async function getSpokenLanguageAliases(): Promise<SpokenLanguageAliasMap> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('spoken_language_aliases')
    .select('alias_normalized, language_code');

  if (error) throw error;

  const map: SpokenLanguageAliasMap = new Map();
  for (const row of data ?? []) {
    map.set(row.alias_normalized, row.language_code);
  }
  return map;
}
