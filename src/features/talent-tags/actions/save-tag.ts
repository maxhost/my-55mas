'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveTalentTagSchema } from '../schemas';
import type { SaveTalentTagInput } from '../types';

type SaveTagResult =
  | { data: { id: string } }
  | { error: Record<string, string[]> };

export async function saveTag(input: SaveTalentTagInput): Promise<SaveTagResult> {
  const parsed = saveTalentTagSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { tag } = parsed.data;
  const supabase = createClient();

  const i18n = Object.fromEntries(
    Object.entries(tag.translations).map(([locale, name]) => [locale, { name }])
  ) as unknown as Json;

  let tagId: string;

  if (tag.id) {
    const { error } = await supabase
      .from('talent_tags')
      .update({
        slug: tag.slug,
        sort_order: tag.sort_order,
        is_active: tag.is_active,
        i18n,
      })
      .eq('id', tag.id);
    if (error) return { error: { _db: [error.message] } };
    tagId = tag.id;
  } else {
    const { data, error } = await supabase
      .from('talent_tags')
      .insert({
        slug: tag.slug,
        sort_order: tag.sort_order,
        is_active: tag.is_active,
        i18n,
      })
      .select('id')
      .single();
    if (error) return { error: { _db: [error.message] } };
    tagId = data.id;
  }

  revalidatePath('/[locale]/(admin)/admin/talent-tags', 'layout');
  return { data: { id: tagId } };
}
