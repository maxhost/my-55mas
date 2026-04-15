'use server';

import { createClient } from '@/lib/supabase/server';

export type ActiveTalentTagOption = {
  id: string;
  name: string;
};

/**
 * Returns active tags with name in the requested locale, falling back to 'es'
 * if a translation is missing. Consumers outside this feature should NOT import
 * this function — they should query talent_tags + talent_tag_translations
 * directly to preserve feature isolation.
 */
export async function getActiveTags(locale: string): Promise<ActiveTalentTagOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('talent_tags')
    .select('id, slug, sort_order, talent_tag_translations(locale, name)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const rawTrans = row.talent_tag_translations as unknown as
      | { locale: string; name: string }[]
      | null;
    const byLocale = new Map<string, string>();
    for (const t of rawTrans ?? []) byLocale.set(t.locale, t.name);

    const name = byLocale.get(locale) ?? byLocale.get('es') ?? row.slug;
    return { id: row.id, name };
  });
}
