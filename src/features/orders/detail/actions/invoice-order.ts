'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { invoiceOrderSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

const VAT_RATE = 0.21;

/**
 * Issues an invoice for the draft billing lines of an order:
 *   - scope=client: creates a `client_payments` row and links all client
 *     lines (those with client_payment_id IS NULL). VAT is included in
 *     total_amount. Also inserts a `client_payment_items` aggregate row
 *     pointing to the order. Sets orders.payment_status='pendiente_de_pago'.
 *   - scope=talent: creates a `talent_payments` row for the given talent
 *     and links all that talent's draft lines. No VAT.
 *
 * The action is NOT a SQL transaction (Supabase JS doesn't expose them) —
 * if the items insert fails after the payments insert, the payment row
 * stays orphaned. For Phase 2 the cost of that edge case is low; if it
 * becomes problematic we move this to a SECURITY DEFINER RPC.
 */
export async function invoiceOrder(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = invoiceOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, scope, talentId } = parsed.data;

  if (scope === 'talent' && !talentId) {
    return { error: { message: 'talentId is required for talent scope' } };
  }

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, currency, client_id, appointment_date')
    .eq('id', orderId)
    .maybeSingle();
  if (orderErr) return { error: { message: orderErr.message } };
  if (!order) return { error: { message: 'Order not found' } };

  const period = (order.appointment_date ?? new Date().toISOString()).substring(0, 7) + '-01';
  const { data: auth } = await supabase.auth.getUser();
  const createdBy = auth.user?.id ?? null;

  if (scope === 'client') {
    return invoiceClient({ supabase, orderId, currency: order.currency, clientUserId: order.client_id, period, createdBy });
  }
  return invoiceTalent({
    supabase,
    orderId,
    talentId: talentId!,
    currency: order.currency,
    period,
    createdBy,
  });
}

type Supabase = ReturnType<typeof createClient>;

async function invoiceClient(args: {
  supabase: Supabase;
  orderId: string;
  currency: string;
  clientUserId: string;
  period: string;
  createdBy: string | null;
}): Promise<Result> {
  const { supabase, orderId, currency, clientUserId, period, createdBy } = args;

  const { data: lines, error: linesErr } = await supabase
    .from('order_billing_lines')
    .select('id, total')
    .eq('order_id', orderId)
    .eq('scope', 'client')
    .is('client_payment_id', null);
  if (linesErr) return { error: { message: linesErr.message } };
  if (!lines || lines.length === 0) {
    return { error: { message: 'No draft client lines to invoice' } };
  }

  const subtotal = lines.reduce((acc, l) => acc + Number(l.total), 0);
  const totalAmount = round(subtotal * (1 + VAT_RATE));

  const { data: clientProfile, error: cpErr } = await supabase
    .from('client_profiles')
    .select('id')
    .eq('user_id', clientUserId)
    .maybeSingle();
  if (cpErr) return { error: { message: cpErr.message } };
  if (!clientProfile) return { error: { message: 'Client profile not found' } };

  const { data: payment, error: payErr } = await supabase
    .from('client_payments')
    .insert({
      client_id: clientProfile.id,
      period_month: period,
      status: 'pending',
      total_amount: totalAmount,
      currency,
      created_by: createdBy,
    })
    .select('id')
    .single();
  if (payErr || !payment) return { error: { message: payErr?.message ?? 'Failed to create payment' } };

  const { error: itemErr } = await supabase.from('client_payment_items').insert({
    payment_id: payment.id,
    order_id: orderId,
    total: totalAmount,
  });
  if (itemErr) return { error: { message: itemErr.message } };

  const { error: linkErr } = await supabase
    .from('order_billing_lines')
    .update({ client_payment_id: payment.id })
    .in('id', lines.map((l) => l.id));
  if (linkErr) return { error: { message: linkErr.message } };

  await supabase
    .from('orders')
    .update({ payment_status: 'pendiente_de_pago' })
    .eq('id', orderId);

  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}

async function invoiceTalent(args: {
  supabase: Supabase;
  orderId: string;
  talentId: string;
  currency: string;
  period: string;
  createdBy: string | null;
}): Promise<Result> {
  const { supabase, orderId, talentId, currency, period, createdBy } = args;

  const { data: lines, error: linesErr } = await supabase
    .from('order_billing_lines')
    .select('id, total')
    .eq('order_id', orderId)
    .eq('scope', 'talent')
    .eq('talent_id', talentId)
    .is('talent_payment_id', null);
  if (linesErr) return { error: { message: linesErr.message } };
  if (!lines || lines.length === 0) {
    return { error: { message: 'No draft talent lines to invoice' } };
  }

  const totalAmount = round(lines.reduce((acc, l) => acc + Number(l.total), 0));

  const { data: payment, error: payErr } = await supabase
    .from('talent_payments')
    .insert({
      talent_id: talentId,
      period_month: period,
      status: 'pending',
      total_amount: totalAmount,
      currency,
      created_by: createdBy,
    })
    .select('id')
    .single();
  if (payErr || !payment) return { error: { message: payErr?.message ?? 'Failed to create payment' } };

  const { error: itemErr } = await supabase.from('talent_payment_items').insert({
    payment_id: payment.id,
    order_id: orderId,
    total: totalAmount,
  });
  if (itemErr) return { error: { message: itemErr.message } };

  const { error: linkErr } = await supabase
    .from('order_billing_lines')
    .update({ talent_payment_id: payment.id })
    .in('id', lines.map((l) => l.id));
  if (linkErr) return { error: { message: linkErr.message } };

  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return { data: { ok: true } };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
