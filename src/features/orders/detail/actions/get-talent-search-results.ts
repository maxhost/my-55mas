'use server';

import { createClient } from '@/lib/supabase/server';
import type { TalentSearchResult } from '../types';

const HIDDEN_TALENT_STATUSES = ['archived', 'excluded', 'inactive'];

/**
 * Returns the full list of active talents the admin can assign to an order.
 *
 * Strategy:
 *   1. Fetch every active talent_profile (excluding archived/excluded/inactive).
 *   2. Exclude talents already assigned to this order via `order_talents`.
 *   3. For each candidate, compute:
 *      - `is_qualified`: has a `talent_services` row for this order's
 *        service_id + country_id (the talent is officially registered for
 *        that service in that market).
 *      - `rating_avg` / `completed_count`: aggregated from `orders` filtered
 *        by service_id + talent_id.
 *   4. Filter by search query (full_name, case-insensitive).
 *   5. Sort: qualified first, then rating DESC, then completed DESC,
 *      then name ASC. The admin can still pick non-qualified talents —
 *      they just appear lower.
 */
export async function getTalentSearchResults(
  orderId: string,
  query: string,
): Promise<TalentSearchResult[]> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('service_id, country_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return [];

  const { data: alreadyAssigned } = await supabase
    .from('order_talents')
    .select('talent_id')
    .eq('order_id', orderId);
  const assignedSet = new Set((alreadyAssigned ?? []).map((r) => r.talent_id));

  const { data: tps } = await supabase
    .from('talent_profiles')
    .select('id, user_id, status, profiles!talent_profiles_user_id_fkey(id, full_name, email, phone)')
    .not('status', 'in', `(${HIDDEN_TALENT_STATUSES.join(',')})`);

  type TpRow = {
    id: string;
    user_id: string;
    status: string;
    profiles: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
  };
  const allRows = (tps ?? []) as unknown as TpRow[];
  const candidates = allRows.filter((t) => !assignedSet.has(t.id));
  if (candidates.length === 0) return [];

  const candidateIds = candidates.map((t) => t.id);
  const userIds = candidates.map((t) => t.user_id);

  // Qualified talents: have a talent_services row for this service+country.
  const qualifiedSet = await loadQualifiedSet(
    supabase,
    candidateIds,
    order.service_id,
    order.country_id,
  );

  // Rating + completed stats for this service. Talents without orders for
  // this service get rating=null + completed=0 — still listed.
  const statsByUser = await loadServiceStats(supabase, userIds, order.service_id);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? candidates.filter((r) => (r.profiles?.full_name ?? '').toLowerCase().includes(q))
    : candidates;

  const enriched = filtered.map((r) => {
    const stats = statsByUser.get(r.user_id) ?? { ratings: [], completed: 0 };
    const ratingAvg =
      stats.ratings.length === 0
        ? null
        : stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length;
    return {
      id: r.id,
      user_id: r.user_id,
      full_name: r.profiles?.full_name ?? null,
      email: r.profiles?.email ?? null,
      phone: r.profiles?.phone ?? null,
      rating_avg: ratingAvg,
      completed_count: stats.completed,
      is_qualified: qualifiedSet.has(r.id),
    } satisfies TalentSearchResult;
  });

  enriched.sort((a, b) => {
    if (a.is_qualified !== b.is_qualified) return a.is_qualified ? -1 : 1;
    const aRating = a.rating_avg ?? -1;
    const bRating = b.rating_avg ?? -1;
    if (aRating !== bRating) return bRating - aRating;
    if (a.completed_count !== b.completed_count) return b.completed_count - a.completed_count;
    return (a.full_name ?? '').localeCompare(b.full_name ?? '');
  });

  return enriched;
}

type Supabase = ReturnType<typeof createClient>;

async function loadQualifiedSet(
  supabase: Supabase,
  candidateIds: string[],
  serviceId: string | null,
  countryId: string,
): Promise<Set<string>> {
  if (!serviceId || candidateIds.length === 0) return new Set();
  const { data } = await supabase
    .from('talent_services')
    .select('talent_id')
    .eq('service_id', serviceId)
    .eq('country_id', countryId)
    .in('talent_id', candidateIds);
  return new Set((data ?? []).map((r) => r.talent_id));
}

async function loadServiceStats(
  supabase: Supabase,
  userIds: string[],
  serviceId: string | null,
): Promise<Map<string, { ratings: number[]; completed: number }>> {
  const map = new Map<string, { ratings: number[]; completed: number }>();
  if (!serviceId || userIds.length === 0) return map;
  const { data } = await supabase
    .from('orders')
    .select('talent_id, status, rating')
    .eq('service_id', serviceId)
    .in('talent_id', userIds);
  for (const o of data ?? []) {
    if (!o.talent_id) continue;
    let entry = map.get(o.talent_id);
    if (!entry) {
      entry = { ratings: [], completed: 0 };
      map.set(o.talent_id, entry);
    }
    if (o.status === 'terminado') entry.completed += 1;
    if (typeof o.rating === 'number') entry.ratings.push(o.rating);
  }
  return map;
}
