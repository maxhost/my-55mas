'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { addOrderTalentSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Inserts into `order_talents` after validating that the assigned count
 * stays within `orders.talents_needed`. Server-side bound check is the
 * authoritative one — UI also pre-validates but defense-in-depth.
 */
export async function addOrderTalent(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = addOrderTalentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, talentId } = parsed.data;

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('talents_needed')
    .eq('id', orderId)
    .maybeSingle();
  if (orderErr) return { error: { message: orderErr.message } };
  if (!order) return { error: { message: 'Order not found' } };

  const { count } = await supabase
    .from('order_talents')
    .select('talent_id', { count: 'exact', head: true })
    .eq('order_id', orderId);
  if ((count ?? 0) >= order.talents_needed) {
    return { error: { message: 'Talents needed bound reached' } };
  }

  const { data: auth } = await supabase.auth.getUser();
  const isPrimary = (count ?? 0) === 0;

  const { error } = await supabase.from('order_talents').insert({
    order_id: orderId,
    talent_id: talentId,
    is_primary: isPrimary,
    assigned_by: auth.user?.id ?? null,
  });
  if (error) return { error: { message: error.message } };

  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}
