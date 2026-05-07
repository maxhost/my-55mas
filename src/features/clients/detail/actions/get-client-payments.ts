'use server';

import { createClient } from '@/lib/supabase/server';
import type { ClientPayment, ClientPaymentStatus } from '../types';

export async function getClientPayments(clientId: string): Promise<ClientPayment[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from('client_payments')
    .select(
      'id, period_month, status, total_amount, currency, payment_method, payment_proof_url, paid_at, notes, created_at',
    )
    .eq('client_id', clientId)
    .order('period_month', { ascending: false });

  return (data ?? []).map((p) => ({
    id: p.id,
    period_month: p.period_month,
    status: p.status as ClientPaymentStatus,
    total_amount: Number(p.total_amount),
    currency: p.currency,
    payment_method: p.payment_method,
    payment_proof_url: p.payment_proof_url,
    paid_at: p.paid_at,
    notes: p.notes,
    created_at: p.created_at,
  }));
}
