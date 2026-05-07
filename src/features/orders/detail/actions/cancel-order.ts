'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { cancelOrderSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Sets orders.status='cancelado' and inserts a system `order_notes` row
 * recording the reason. Idempotent: returns ok if already cancelled.
 */
export async function cancelOrder(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = cancelOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, reason } = parsed.data;

  const { data: existing, error: fetchErr } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .maybeSingle();
  if (fetchErr) return { error: { message: fetchErr.message } };
  if (!existing) return { error: { message: 'Order not found' } };
  if (existing.status === 'cancelado') return { data: { ok: true } };

  const { error: updateErr } = await supabase
    .from('orders')
    .update({ status: 'cancelado' })
    .eq('id', orderId);
  if (updateErr) return { error: { message: updateErr.message } };

  const { data: auth } = await supabase.auth.getUser();
  const body = reason
    ? `Status: ${existing.status} → cancelado. Razón: ${reason}`
    : `Status: ${existing.status} → cancelado`;
  await supabase.from('order_notes').insert({
    order_id: orderId,
    author_id: auth.user?.id ?? null,
    body,
    is_system: true,
  });

  revalidatePath('/[locale]/(admin)/admin/orders', 'page');
  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}
