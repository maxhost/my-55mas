'use server';

import { createClient } from '@/lib/supabase/server';
import type { TalentPayment, TalentPaymentsStats, TalentPaymentStatus } from '../types';

type Result = {
  payments: TalentPayment[];
  stats: TalentPaymentsStats;
};

const DEFAULT_CURRENCY = 'EUR';

export async function getTalentPayments(talentId: string): Promise<Result> {
  const supabase = createClient();

  const { data: tp } = await supabase
    .from('talent_profiles')
    .select('user_id')
    .eq('id', talentId)
    .maybeSingle();
  if (!tp) return { payments: [], stats: emptyStats() };

  const [paymentsRes, ordersRes] = await Promise.all([
    supabase
      .from('talent_payments')
      .select(
        'id, period_month, status, total_amount, total_hours, currency, payment_method, payment_proof_url, paid_at, notes, created_at',
      )
      .eq('talent_id', talentId)
      .order('period_month', { ascending: false }),
    supabase
      .from('orders')
      .select('id, talent_amount, currency, status')
      .eq('talent_id', tp.user_id)
      .eq('status', 'completado'),
  ]);

  const payments: TalentPayment[] = (paymentsRes.data ?? []).map((p) => ({
    id: p.id,
    period_month: p.period_month,
    status: p.status as TalentPaymentStatus,
    total_amount: Number(p.total_amount),
    total_hours: p.total_hours === null ? null : Number(p.total_hours),
    currency: p.currency,
    payment_method: p.payment_method,
    payment_proof_url: p.payment_proof_url,
    paid_at: p.paid_at,
    notes: p.notes,
    created_at: p.created_at,
  }));

  const stats = computeStats({
    payments,
    orders: (ordersRes.data ?? []).map((o) => ({
      id: o.id,
      talent_amount: o.talent_amount === null ? 0 : Number(o.talent_amount),
      currency: o.currency,
    })),
  });

  return { payments, stats };
}

function emptyStats(): TalentPaymentsStats {
  return { acumulado: 0, pendiente: 0, pendingOrders: 0, currency: DEFAULT_CURRENCY };
}

function computeStats(args: {
  payments: TalentPayment[];
  orders: { id: string; talent_amount: number; currency: string }[];
}): TalentPaymentsStats {
  const { payments, orders } = args;
  const currency = payments[0]?.currency ?? orders[0]?.currency ?? DEFAULT_CURRENCY;

  const acumulado = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + p.total_amount, 0);

  const pendingOrdersTotal = orders
    .filter((o) => o.currency === currency)
    .reduce((acc, o) => acc + o.talent_amount, 0);
  const paidOrPendingPaymentsTotal = payments
    .filter((p) => p.status === 'paid' || p.status === 'approved' || p.status === 'pending')
    .filter((p) => p.currency === currency)
    .reduce((acc, p) => acc + p.total_amount, 0);
  const pendiente = Math.max(0, pendingOrdersTotal - paidOrPendingPaymentsTotal);

  return {
    acumulado,
    pendiente,
    pendingOrders: orders.length,
    currency,
  };
}
