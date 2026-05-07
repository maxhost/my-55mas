'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { saveOrderServiceAnswersSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

export async function saveOrderServiceAnswers(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = saveOrderServiceAnswersSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, answers } = parsed.data;
  const { error } = await supabase
    .from('orders')
    .update({ form_data: (answers as unknown) as Json })
    .eq('id', orderId);
  if (error) return { error: { message: error.message } };
  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}
