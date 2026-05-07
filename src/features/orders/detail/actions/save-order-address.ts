'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { saveOrderAddressSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

export async function saveOrderAddress(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = saveOrderAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, service_address, service_city_id, service_postal_code } = parsed.data;
  const { error } = await supabase
    .from('orders')
    .update({ service_address, service_city_id, service_postal_code })
    .eq('id', orderId);
  if (error) return { error: { message: error.message } };
  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}
