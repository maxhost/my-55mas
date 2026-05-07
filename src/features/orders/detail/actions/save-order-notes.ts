'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveOrderNotesSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

export async function saveOrderNotes(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = saveOrderNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, notes, talents_needed } = parsed.data;
  const { error } = await supabase
    .from('orders')
    .update({ notes, talents_needed })
    .eq('id', orderId);
  if (error) return { error: { message: error.message } };
  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}
