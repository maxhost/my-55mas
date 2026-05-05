'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { updateTalentTagsSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Reconciles `talent_tag_assignments` to match the desired set of tag IDs.
 * Composite PK is (talent_id, tag_id) so we delete removed and insert added.
 */
export async function updateTalentTags(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = updateTalentTagsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { talentId, tagIds } = parsed.data;

  const { data: auth } = await supabase.auth.getUser();
  const assignedBy = auth.user?.id ?? null;

  const { data: existing, error: fetchErr } = await supabase
    .from('talent_tag_assignments')
    .select('tag_id')
    .eq('talent_id', talentId);
  if (fetchErr) return { error: { message: fetchErr.message } };

  const desired = new Set(tagIds);
  const current = new Set((existing ?? []).map((r) => r.tag_id));
  const toAdd = tagIds.filter((id) => !current.has(id));
  const toRemove = (existing ?? [])
    .map((r) => r.tag_id)
    .filter((id) => !desired.has(id));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('talent_tag_assignments')
      .delete()
      .eq('talent_id', talentId)
      .in('tag_id', toRemove);
    if (error) return { error: { message: error.message } };
  }
  if (toAdd.length > 0) {
    const { error } = await supabase.from('talent_tag_assignments').insert(
      toAdd.map((tag_id) => ({
        talent_id: talentId,
        tag_id,
        assigned_by: assignedBy,
      })),
    );
    if (error) return { error: { message: error.message } };
  }

  revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');
  return { data: { ok: true } };
}
