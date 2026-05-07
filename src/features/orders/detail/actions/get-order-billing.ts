'use server';

import { createClient } from '@/lib/supabase/server';
import type { BillingLine, BillingTabData, TalentBillingBlock } from '../types';

const VAT_RATE = 0.21;

/**
 * Reads `order_billing_lines` for the order and groups them into the client
 * section + one block per talent that has lines.
 *
 * `invoiced` is computed: a section is invoiced when its lines have a
 * non-null payment FK. Talent blocks include any currently-assigned talent
 * even with no lines yet (so admin can add lines per talent).
 */
export async function getOrderBilling(orderId: string): Promise<BillingTabData> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('currency')
    .eq('id', orderId)
    .maybeSingle();
  const currency = order?.currency ?? 'EUR';

  const [linesRes, talentsRes] = await Promise.all([
    supabase
      .from('order_billing_lines')
      .select('id, scope, talent_id, description, unit_price, qty, discount_pct, total, client_payment_id, talent_payment_id, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }),
    supabase
      .from('order_talents')
      .select('talent_id, talent_profiles(id, profiles(id, full_name))')
      .eq('order_id', orderId),
  ]);

  const lines = linesRes.data ?? [];
  const clientLinesRaw = lines.filter((l) => l.scope === 'client');
  const clientLines: BillingLine[] = clientLinesRaw.map(toLine);
  const clientInvoiced = clientLinesRaw.length > 0 && clientLinesRaw.every((l) => l.client_payment_id !== null);
  const clientSubtotal = sumLines(clientLines);
  const clientTax = round(clientSubtotal * VAT_RATE);

  type TalentRow = {
    talent_id: string;
    talent_profiles: { id: string; profiles: { id: string; full_name: string | null } | null } | null;
  };
  const assignedRows = (talentsRes.data ?? []) as unknown as TalentRow[];
  const talentNameById = new Map<string, string | null>();
  for (const r of assignedRows) {
    talentNameById.set(r.talent_id, r.talent_profiles?.profiles?.full_name ?? null);
  }
  const talentIdsWithLines = new Set(
    lines.filter((l) => l.scope === 'talent' && l.talent_id !== null).map((l) => l.talent_id as string),
  );
  const allTalentIds = Array.from(
    new Set<string>([...assignedRows.map((r) => r.talent_id), ...Array.from(talentIdsWithLines)]),
  );

  const missingNames = allTalentIds.filter((id) => !talentNameById.has(id));
  if (missingNames.length > 0) {
    const { data: tps } = await supabase
      .from('talent_profiles')
      .select('id, profiles(id, full_name)')
      .in('id', missingNames);
    for (const tp of (tps ?? []) as unknown as Array<{
      id: string;
      profiles: { full_name: string | null } | null;
    }>) {
      talentNameById.set(tp.id, tp.profiles?.full_name ?? null);
    }
  }

  const talentBlocks: TalentBillingBlock[] = allTalentIds.map((talentId) => {
    const ownLinesRaw = lines.filter((l) => l.scope === 'talent' && l.talent_id === talentId);
    const ownLines: BillingLine[] = ownLinesRaw.map(toLine);
    const subtotal = sumLines(ownLines);
    const invoiced = ownLinesRaw.length > 0 && ownLinesRaw.every((l) => l.talent_payment_id !== null);
    return {
      talent_id: talentId,
      talent_name: talentNameById.get(talentId) ?? null,
      lines: ownLines,
      subtotal,
      total: subtotal,
      currency,
      invoiced,
    };
  });

  let totalPaid = 0;
  let totalOwed = 0;
  if (clientInvoiced) {
    const paymentIds = Array.from(
      new Set(clientLinesRaw.map((l) => l.client_payment_id).filter((p): p is string => !!p)),
    );
    if (paymentIds.length > 0) {
      const { data: pays } = await supabase
        .from('client_payments')
        .select('id, status, total_amount')
        .in('id', paymentIds);
      for (const p of pays ?? []) {
        const amount = Number(p.total_amount);
        if (p.status === 'paid') totalPaid += amount;
        else if (p.status === 'pending' || p.status === 'approved') totalOwed += amount;
      }
    }
  } else {
    totalOwed = clientSubtotal + clientTax;
  }

  return {
    clientBilling: {
      lines: clientLines,
      subtotal: clientSubtotal,
      tax_rate: VAT_RATE,
      tax_amount: clientTax,
      total: clientSubtotal + clientTax,
      currency,
      invoiced: clientInvoiced,
      total_paid: round(totalPaid),
      total_owed: round(totalOwed),
    },
    talentBlocks,
  };
}

type LineRow = {
  id: string;
  description: string;
  unit_price: number | string;
  qty: number | string;
  discount_pct: number | string;
  total: number | string;
};

function toLine(r: LineRow): BillingLine {
  return {
    id: r.id,
    description: r.description,
    unit_price: Number(r.unit_price),
    qty: Number(r.qty),
    discount_pct: Number(r.discount_pct),
    total: Number(r.total),
  };
}

function sumLines(lines: BillingLine[]): number {
  return round(lines.reduce((acc, l) => acc + l.total, 0));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
