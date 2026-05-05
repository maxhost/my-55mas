'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type { TalentReviewByService } from '../types';

/**
 * Aggregates reviews from `orders.rating` per service for a given talent.
 *
 * Per spec: a review IS the rating that a client left on a completed order.
 * No separate reviews table — we group orders by service_id and average.
 */
export async function getTalentReviews(
  talentId: string,
  locale: string,
): Promise<TalentReviewByService[]> {
  const supabase = createClient();

  const { data: tp } = await supabase
    .from('talent_profiles')
    .select('user_id')
    .eq('id', talentId)
    .maybeSingle();
  if (!tp) return [];

  const { data: orders } = await supabase
    .from('orders')
    .select('service_id, status, rating')
    .eq('talent_id', tp.user_id);
  if (!orders || orders.length === 0) return [];

  const grouped = new Map<
    string,
    { ratings: number[]; completed: number }
  >();
  for (const o of orders) {
    if (!o.service_id) continue;
    let bucket = grouped.get(o.service_id);
    if (!bucket) {
      bucket = { ratings: [], completed: 0 };
      grouped.set(o.service_id, bucket);
    }
    if (o.status === 'completado') bucket.completed += 1;
    if (typeof o.rating === 'number') bucket.ratings.push(o.rating);
  }
  if (grouped.size === 0) return [];

  const serviceIds = Array.from(grouped.keys());
  const { data: services } = await supabase
    .from('services')
    .select('id, slug, i18n')
    .in('id', serviceIds);
  const nameMap = new Map<string, string>(
    (services ?? []).map((s) => [
      s.id,
      localizedField(s.i18n as I18nRecord, locale, 'name') ?? s.slug,
    ]),
  );

  const out: TalentReviewByService[] = [];
  for (const entry of Array.from(grouped.entries())) {
    const serviceId = entry[0];
    const bucket = entry[1];
    if (bucket.ratings.length === 0 && bucket.completed === 0) continue;
    const ratingAvg =
      bucket.ratings.length === 0
        ? 0
        : bucket.ratings.reduce((a: number, b: number) => a + b, 0) / bucket.ratings.length;
    out.push({
      service_id: serviceId,
      service_name: nameMap.get(serviceId) ?? null,
      ratingAvg,
      ratingCount: bucket.ratings.length,
      completedOrdersCount: bucket.completed,
    });
  }
  out.sort(
    (a: TalentReviewByService, b: TalentReviewByService) =>
      b.ratingCount - a.ratingCount || b.ratingAvg - a.ratingAvg,
  );
  return out;
}
