'use server';

import { createClient } from '@/lib/supabase/server';
import type { TalentTagWithTranslations } from '../types';

type I18nNameRecord = Record<string, { name?: string } | null> | null;

function flattenNames(i18n: I18nNameRecord): Record<string, string> {
  const out: Record<string, string> = {};
  if (!i18n) return out;
  for (const [locale, entry] of Object.entries(i18n)) {
    const n = entry?.name;
    if (typeof n === 'string') out[locale] = n;
  }
  return out;
}

export async function listTags(): Promise<TalentTagWithTranslations[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('talent_tags')
    .select('id, slug, sort_order, is_active, i18n')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    sort_order: row.sort_order,
    is_active: row.is_active,
    translations: flattenNames(row.i18n as I18nNameRecord),
  }));
}
