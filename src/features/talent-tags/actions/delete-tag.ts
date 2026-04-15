'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type DeleteTagResult = { data: { id: string } } | { error: Record<string, string[]> };

/**
 * Soft delete: marks the tag as inactive. Preserves historical assignments.
 */
export async function deleteTag(id: string): Promise<DeleteTagResult> {
  if (!id) return { error: { id: ['id is required'] } };

  const supabase = createClient();
  const { error } = await supabase
    .from('talent_tags')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return { error: { _db: [error.message] } };

  revalidatePath('/[locale]/(admin)/admin/talent-tags', 'layout');
  return { data: { id } };
}
