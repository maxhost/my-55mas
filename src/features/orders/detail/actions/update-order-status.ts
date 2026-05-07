'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { updateOrderStatusSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Updates `orders.status` and inserts a system `order_notes` entry
 * recording the transition. Auth is optional during construction (admin
 * is public): `author_id` falls back to null when no session.
 */
export async function updateOrderStatus(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, status } = parsed.data;

  const { data: existing, error: fetchErr } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .maybeSingle();
  if (fetchErr) return { error: { message: fetchErr.message } };
  if (!existing) return { error: { message: 'Order not found' } };
  if (existing.status === status) return { data: { ok: true } };

  const { error: updateErr } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  if (updateErr) return { error: { message: updateErr.message } };

  const { data: auth } = await supabase.auth.getUser();
  await supabase.from('order_notes').insert({
    order_id: orderId,
    author_id: auth.user?.id ?? null,
    body: `Status: ${existing.status} → ${status}`,
    is_system: true,
  });

  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}
