'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { removeOrderTalentSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Removes a talent from `order_talents`. If the removed row was primary,
 * promotes the oldest remaining assignment to primary so the order keeps
 * a primary while it still has talents.
 */
export async function removeOrderTalent(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = removeOrderTalentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, talentId } = parsed.data;

  const { data: removed, error: fetchErr } = await supabase
    .from('order_talents')
    .select('is_primary')
    .eq('order_id', orderId)
    .eq('talent_id', talentId)
    .maybeSingle();
  if (fetchErr) return { error: { message: fetchErr.message } };
  if (!removed) return { data: { ok: true } }; // already absent

  const { error: delErr } = await supabase
    .from('order_talents')
    .delete()
    .eq('order_id', orderId)
    .eq('talent_id', talentId);
  if (delErr) return { error: { message: delErr.message } };

  if (removed.is_primary) {
    const { data: nextPrimary } = await supabase
      .from('order_talents')
      .select('talent_id, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (nextPrimary) {
      await supabase
        .from('order_talents')
        .update({ is_primary: true })
        .eq('order_id', orderId)
        .eq('talent_id', nextPrimary.talent_id);
    }
  }

  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}
