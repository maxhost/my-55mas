'use server';

import { createClient } from '@/lib/supabase/server';
import type { AssignedTalent } from '../types';

/**
 * Lists talents assigned to this order with stats per service.
 *
 * Joins order_talents → talent_profiles → profiles. Computes rating_avg /
 * rating_count / completed_count from `orders` filtered by talent_id =
 * profiles.user_id and the order's service_id.
 */
export async function getOrderTalents(orderId: string): Promise<AssignedTalent[]> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('service_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return [];

  const { data: assigned } = await supabase
    .from('order_talents')
    .select('talent_id, is_primary, talent_profiles(id, user_id, profiles(id, full_name, email, phone))')
    .eq('order_id', orderId);
  if (!assigned || assigned.length === 0) return [];

  type Row = {
    talent_id: string;
    is_primary: boolean;
    talent_profiles: {
      id: string;
      user_id: string;
      profiles: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
    } | null;
  };
  const rows = assigned as unknown as Row[];

  const userIds = rows
    .map((r) => r.talent_profiles?.user_id)
    .filter((id): id is string => !!id);

  // Aggregate ratings + completed counts per talent for THIS service.
  const statsByUser = new Map<string, { ratings: number[]; completed: number }>();
  if (userIds.length > 0 && order.service_id) {
    const { data: relatedOrders } = await supabase
      .from('orders')
      .select('talent_id, status, rating')
      .eq('service_id', order.service_id)
      .in('talent_id', userIds);
    for (const o of relatedOrders ?? []) {
      if (!o.talent_id) continue;
      let entry = statsByUser.get(o.talent_id);
      if (!entry) {
        entry = { ratings: [], completed: 0 };
        statsByUser.set(o.talent_id, entry);
      }
      if (o.status === 'terminado') entry.completed += 1;
      if (typeof o.rating === 'number') entry.ratings.push(o.rating);
    }
  }

  return rows
    .filter((r) => r.talent_profiles !== null)
    .map((r) => {
      const tp = r.talent_profiles!;
      const profile = tp.profiles;
      const stats = statsByUser.get(tp.user_id) ?? { ratings: [], completed: 0 };
      const ratingAvg =
        stats.ratings.length === 0
          ? null
          : stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length;
      return {
        id: tp.id,
        user_id: tp.user_id,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        phone: profile?.phone ?? null,
        rating_avg: ratingAvg,
        rating_count: stats.ratings.length,
        completed_count: stats.completed,
        is_primary: r.is_primary,
      };
    });
}
