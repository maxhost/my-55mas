'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveOrderHoursSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

type LogInput = {
  id: string;
  kind: 'hours' | 'kilometers' | 'other';
  description: string | null;
  unit_price: number;
  reported_qty: number;
  confirmed_qty: number | null;
};

/**
 * Reconciles `order_hours_logs` for the order. Strategy:
 *   - For hours/kilometers: there's a single canonical entry per kind. The
 *     UI sends one entry; we update by id (existing) or insert (id='').
 *   - For 'other': delete the rows whose ids are not in the incoming set,
 *     then upsert the rest. Deletes happen first so re-using an existing id
 *     after removing/re-adding stays consistent.
 */
export async function saveOrderHours(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = saveOrderHoursSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, totalHoursLog, totalKilometersLog, otherLogs } = parsed.data;

  const totalErr = await upsertSingleton(supabase, orderId, totalHoursLog);
  if (totalErr) return { error: { message: totalErr } };
  const kmErr = await upsertSingleton(supabase, orderId, totalKilometersLog);
  if (kmErr) return { error: { message: kmErr } };

  // Reconcile "other" logs: delete removed ones, then upsert.
  const incomingOtherIds = otherLogs.filter((l) => l.id !== '').map((l) => l.id);
  const { data: existingOthers } = await supabase
    .from('order_hours_logs')
    .select('id')
    .eq('order_id', orderId)
    .eq('kind', 'other');
  const toRemove = (existingOthers ?? [])
    .map((r) => r.id)
    .filter((id) => !incomingOtherIds.includes(id));
  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('order_hours_logs')
      .delete()
      .in('id', toRemove);
    if (error) return { error: { message: error.message } };
  }

  for (const log of otherLogs) {
    const err = await upsertOther(supabase, orderId, log);
    if (err) return { error: { message: err } };
  }

  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}

async function upsertSingleton(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  log: LogInput,
): Promise<string | null> {
  const payload = {
    description: log.description,
    unit_price: log.unit_price,
    reported_qty: log.reported_qty,
    confirmed_qty: log.confirmed_qty,
  };
  if (log.id === '') {
    const { error } = await supabase
      .from('order_hours_logs')
      .insert({ order_id: orderId, kind: log.kind, ...payload });
    return error?.message ?? null;
  }
  const { error } = await supabase
    .from('order_hours_logs')
    .update(payload)
    .eq('id', log.id);
  return error?.message ?? null;
}

async function upsertOther(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  log: LogInput,
): Promise<string | null> {
  const payload = {
    description: log.description,
    unit_price: log.unit_price,
    reported_qty: log.reported_qty,
    confirmed_qty: log.confirmed_qty,
  };
  if (log.id === '') {
    const { error } = await supabase
      .from('order_hours_logs')
      .insert({ order_id: orderId, kind: 'other', ...payload });
    return error?.message ?? null;
  }
  const { error } = await supabase
    .from('order_hours_logs')
    .update(payload)
    .eq('id', log.id);
  return error?.message ?? null;
}
