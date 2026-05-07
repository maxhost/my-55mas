'use server';

import { createClient } from '@/lib/supabase/server';
import type { ClientStats } from '../types';

const DEFAULT_CURRENCY = 'EUR';

/**
 * Aggregates the client's headline numbers:
 *   - totalOrders: count of all orders the client has placed.
 *   - totalPaid:   sum of client_payments.total_amount where status='paid'.
 *   - balanceOwed: sum of client_payments.total_amount where status IN
 *                  ('pending','approved') — invoiced but not yet collected.
 *   - pendingOrders: count of orders flagged payment_status='pending', used
 *                    only as a UI suffix on the highlights row.
 *
 * EUR-only for now (matches talents). Multi-currency would group by currency
 * and surface separate stats per currency.
 */
export async function getClientStats(clientId: string): Promise<ClientStats> {
  const supabase = createClient();

  const { data: cp } = await supabase
    .from('client_profiles')
    .select('user_id')
    .eq('id', clientId)
    .maybeSingle();
  if (!cp) return emptyStats();

  const [ordersRes, paymentsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, payment_status, currency')
      .eq('client_id', cp.user_id),
    supabase
      .from('client_payments')
      .select('status, total_amount, currency')
      .eq('client_id', clientId)
      .eq('currency', DEFAULT_CURRENCY),
  ]);

  const orders = ordersRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + Number(p.total_amount), 0);

  const balanceOwed = payments
    .filter((p) => p.status === 'pending' || p.status === 'approved')
    .reduce((acc, p) => acc + Number(p.total_amount), 0);

  const pendingOrders = orders.filter((o) => o.payment_status === 'pending').length;

  return {
    totalOrders: orders.length,
    totalPaid,
    balanceOwed,
    pendingOrders,
    currency: DEFAULT_CURRENCY,
  };
}

function emptyStats(): ClientStats {
  return {
    totalOrders: 0,
    totalPaid: 0,
    balanceOwed: 0,
    pendingOrders: 0,
    currency: DEFAULT_CURRENCY,
  };
}
