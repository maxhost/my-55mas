'use server';

import { createClient } from '@/lib/supabase/server';
import type { HoursLogEntry, HoursLogKind, HoursTabData } from '../types';

/**
 * Reads order_hours_logs for the order. The UI keeps a singleton row per
 * "hours" / "kilometers" kind (the most recent entry of each, or a blank
 * placeholder when no log exists yet) plus the array of "other" rows.
 */
export async function getOrderHours(orderId: string): Promise<HoursTabData> {
  const supabase = createClient();

  const { data: rows } = await supabase
    .from('order_hours_logs')
    .select('id, talent_id, kind, description, unit_price, reported_qty, confirmed_qty, reported_by, confirmed_by')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  const userIds = Array.from(
    new Set(
      (rows ?? [])
        .flatMap((r) => [r.reported_by, r.confirmed_by])
        .filter((id): id is string => !!id),
    ),
  );
  const nameByUserId = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    for (const p of profiles ?? []) nameByUserId.set(p.id, p.full_name ?? '');
  }

  const entries: HoursLogEntry[] = (rows ?? []).map((r) => ({
    id: r.id,
    kind: r.kind as HoursLogKind,
    description: r.description,
    unit_price: Number(r.unit_price),
    reported_qty: Number(r.reported_qty),
    confirmed_qty: r.confirmed_qty === null ? null : Number(r.confirmed_qty),
    reported_by_name: r.reported_by ? nameByUserId.get(r.reported_by) ?? null : null,
    confirmed_by_name: r.confirmed_by ? nameByUserId.get(r.confirmed_by) ?? null : null,
  }));

  const totalHoursLog = entries.find((e) => e.kind === 'hours') ?? blankLog('hours');
  const totalKilometersLog = entries.find((e) => e.kind === 'kilometers') ?? blankLog('kilometers');
  const otherLogs = entries.filter((e) => e.kind === 'other');

  return {
    totalHoursLog,
    totalKilometersLog,
    otherLogs,
    hoursClient: 0,
  };
}

function blankLog(kind: HoursLogKind): HoursLogEntry {
  return {
    id: '',
    kind,
    description: null,
    unit_price: 0,
    reported_qty: 0,
    confirmed_qty: null,
    reported_by_name: null,
    confirmed_by_name: null,
  };
}
