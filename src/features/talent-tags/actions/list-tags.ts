'use server';

import { createClient } from '@/lib/supabase/server';
import type { TalentTagWithTranslations } from '../types';

export async function listTags(): Promise<TalentTagWithTranslations[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('talent_tags')
    .select('id, slug, sort_order, is_active, talent_tag_translations(locale, name)')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const rawTrans = row.talent_tag_translations as unknown as
      | { locale: string; name: string }[]
      | null;
    const translations: Record<string, string> = {};
    for (const t of rawTrans ?? []) translations[t.locale] = t.name;

    return {
      id: row.id,
      slug: row.slug,
      sort_order: row.sort_order,
      is_active: row.is_active,
      translations,
    };
  });
}
