'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { markPaymentAsPaidSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

/**
 * Marks an existing `talent_payments` row as paid. The proof file must
 * already be uploaded to the `payment-proofs` bucket (the client uploads
 * via a separate Storage call and passes the resulting URL here). This
 * action only flips the status + persists method + URL.
 */
export async function markPaymentAsPaid(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = markPaymentAsPaidSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { paymentId, payment_method, payment_proof_url, notes } = parsed.data;

  const { error } = await supabase
    .from('talent_payments')
    .update({
      status: 'paid',
      payment_method,
      payment_proof_url,
      notes,
      paid_at: new Date().toISOString(),
    })
    .eq('id', paymentId);
  if (error) return { error: { message: error.message } };

  revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');
  return { data: { ok: true } };
}
