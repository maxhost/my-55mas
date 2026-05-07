'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { addBillingLineSchema } from '../schemas';
import type { BillingLine } from '../types';

type Result = { data: BillingLine } | { error: { message: string } };

/**
 * Inserts a draft line into `order_billing_lines`. The line stays "draft"
 * until invoiceOrder() is called, which sets the `client_payment_id` /
 * `talent_payment_id` FK.
 */
export async function addBillingLine(input: unknown): Promise<Result> {
  const supabase = createClient();
  const parsed = addBillingLineSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId, scope, talentId, description, unit_price, qty, discount_pct } = parsed.data;

  if (scope === 'talent' && !talentId) {
    return { error: { message: 'talentId is required for talent scope' } };
  }
  if (scope === 'client' && talentId) {
    return { error: { message: 'talentId must be null for client scope' } };
  }

  const gross = unit_price * qty;
  const total = round(gross * (1 - discount_pct / 100));

  const { data, error } = await supabase
    .from('order_billing_lines')
    .insert({
      order_id: orderId,
      scope,
      talent_id: scope === 'talent' ? talentId : null,
      description,
      unit_price,
      qty,
      discount_pct,
      total,
    })
    .select('id, description, unit_price, qty, discount_pct, total')
    .single();
  if (error || !data) {
    return { error: { message: error?.message ?? 'Failed to create line' } };
  }

  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');
  return {
    data: {
      id: data.id,
      description: data.description,
      unit_price: Number(data.unit_price),
      qty: Number(data.qty),
      discount_pct: Number(data.discount_pct),
      total: Number(data.total),
    },
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
