'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveOrderRecurrenceSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Updates orders.schedule_type and upserts the matching `order_recurrence`
 * row (one per order). For schedule_type='once' we still keep a row when
 * the user provided start_date/window so the data is preserved if they
 * change recurrence type later.
 */
export async function saveOrderRecurrence(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = saveOrderRecurrenceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const {
    orderId,
    schedule_type,
    repeat_every,
    weekdays,
    start_date,
    end_date,
    time_window_start,
    time_window_end,
    hours_per_session,
  } = parsed.data;

  const { error: orderErr } = await supabase
    .from('orders')
    .update({ schedule_type })
    .eq('id', orderId);
  if (orderErr) return { error: { message: orderErr.message } };

  const { error: recErr } = await supabase
    .from('order_recurrence')
    .upsert(
      {
        order_id: orderId,
        repeat_every,
        weekdays,
        start_date,
        end_date,
        time_window_start,
        time_window_end,
        hours_per_session,
      },
      { onConflict: 'order_id' },
    );
  if (recErr) return { error: { message: recErr.message } };

  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}
