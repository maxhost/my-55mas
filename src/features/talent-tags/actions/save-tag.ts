'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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

  let tagId: string;

  if (tag.id) {
    const { error } = await supabase
      .from('talent_tags')
      .update({
        slug: tag.slug,
        sort_order: tag.sort_order,
        is_active: tag.is_active,
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
      })
      .select('id')
      .single();
    if (error) return { error: { _db: [error.message] } };
    tagId = data.id;
  }

  for (const [locale, name] of Object.entries(tag.translations)) {
    const { error } = await supabase
      .from('talent_tag_translations')
      .upsert({ tag_id: tagId, locale, name }, { onConflict: 'tag_id,locale' });
    if (error) return { error: { _db: [error.message] } };
  }

  revalidatePath('/[locale]/(admin)/admin/talent-tags', 'layout');
  return { data: { id: tagId } };
}
