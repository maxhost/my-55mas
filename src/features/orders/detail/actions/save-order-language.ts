'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveOrderLanguageSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

export async function saveOrderLanguage(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = saveOrderLanguageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, preferred_language } = parsed.data;
  const { error } = await supabase
    .from('orders')
    .update({ preferred_language })
    .eq('id', orderId);
  if (error) return { error: { message: error.message } };
  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}
