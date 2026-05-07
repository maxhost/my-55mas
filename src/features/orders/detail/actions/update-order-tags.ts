'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { updateOrderTagsSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

export async function updateOrderTags(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = updateOrderTagsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, tagIds } = parsed.data;

  const { data: existing, error: fetchErr } = await supabase
    .from('order_tag_assignments')
    .select('tag_id')
    .eq('order_id', orderId);
  if (fetchErr) return { error: { message: fetchErr.message } };

  const desired = new Set(tagIds);
  const current = new Set((existing ?? []).map((r) => r.tag_id));
  const toAdd = tagIds.filter((id) => !current.has(id));
  const toRemove = (existing ?? [])
    .map((r) => r.tag_id)
    .filter((id) => !desired.has(id));

  const { data: auth } = await supabase.auth.getUser();
  const assignedBy = auth.user?.id ?? null;

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('order_tag_assignments')
      .delete()
      .eq('order_id', orderId)
      .in('tag_id', toRemove);
    if (error) return { error: { message: error.message } };
  }
  if (toAdd.length > 0) {
    const { error } = await supabase.from('order_tag_assignments').insert(
      toAdd.map((tag_id) => ({ order_id: orderId, tag_id, assigned_by: assignedBy })),
    );
    if (error) return { error: { message: error.message } };
  }

  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}
