'use server';

import { createClient } from '@/lib/supabase/server';
import type { SpokenLanguageAliasMap, SpokenLanguageOption } from './types';

export async function getSpokenLanguageOptions(
  locale: string
): Promise<SpokenLanguageOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('spoken_languages')
    .select('code, sort_order, spoken_language_translations(locale, name)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const trans = row.spoken_language_translations as unknown as
      | { locale: string; name: string }[]
      | null;
    const byLocale = new Map<string, string>();
    for (const t of trans ?? []) byLocale.set(t.locale, t.name);
    const label = byLocale.get(locale) ?? byLocale.get('es') ?? row.code;
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
