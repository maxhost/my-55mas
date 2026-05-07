'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type { TalentSearchFilters, TalentSearchResult } from '../types';

const HIDDEN_TALENT_STATUSES = ['archived', 'excluded', 'inactive'];

type Supabase = ReturnType<typeof createClient>;

type TalentRow = {
  id: string;
  user_id: string;
  status: string;
  country_id: string | null;
  city_id: string | null;
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    address: unknown;
  } | null;
};

type AddressShape = { postal_code?: string };

/**
 * Server-side talent search for the order detail "Add talent" modal.
 *
 * Filters (server-side SQL):
 *   - Exclude statuses archived/excluded/inactive.
 *   - Exclude talents already assigned to this order.
 *   - countryId  → talent_profiles.country_id = X
 *   - cityId     → talent_profiles.city_id = X
 *   - serviceId  → has talent_services row with that service_id (any country
 *                  unless countryId is also set, in which case scoped)
 *
 * Filters (post-fetch in JS — both rely on jsonb / case-insensitive match):
 *   - postalCode → starts-with on profiles.address->postal_code
 *   - query      → full_name contains (case-insensitive)
 *
 * Computes per result:
 *   - is_qualified: has talent_services for the order's service + country.
 *   - rating_avg / rating_count / completed_count: aggregated from `orders`
 *     for the order's service_id (so the numbers reflect this exact service).
 *   - registered_services_count: distinct service_ids the talent has
 *     registered (across all countries) — gives admin a sense of breadth.
 *
 * Sort: qualified → rating DESC → completed DESC → name ASC.
 */
export async function getTalentSearchResults(
  orderId: string,
  filters: TalentSearchFilters,
  locale: string,
): Promise<TalentSearchResult[]> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('service_id, country_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return [];

  const assignedSet = await loadAssignedSet(supabase, orderId);
  const candidatesByService = await loadCandidatesByServiceFilter(
    supabase,
    filters.serviceId,
    filters.countryId,
  );
  if (filters.serviceId !== null && candidatesByService.size === 0) return [];

  const baseRows = await loadTalentRows(supabase, {
    countryId: filters.countryId,
    cityId: filters.cityId,
    candidatesByService: filters.serviceId !== null ? candidatesByService : null,
  });
  const candidates = baseRows.filter((t) => !assignedSet.has(t.id));
  if (candidates.length === 0) return [];

  const candidateIds = candidates.map((t) => t.id);
  const userIds = candidates.map((t) => t.user_id);

  const [qualifiedSet, statsByUser, registeredCounts, geoNames] = await Promise.all([
    loadQualifiedSet(supabase, candidateIds, order.service_id, order.country_id),
    loadServiceStats(supabase, userIds, order.service_id),
    loadRegisteredServicesCount(supabase, candidateIds),
    loadGeoNames(supabase, candidates, locale),
  ]);

  const enriched = candidates.map((r) =>
    buildResult(r, {
      qualifiedSet,
      statsByUser,
      registeredCounts,
      countryNameById: geoNames.countries,
      cityNameById: geoNames.cities,
    }),
  );

  return applyPostFiltersAndSort(enriched, filters);
}

// ── Filtering / loading helpers ─────────────────────────────────────────

async function loadAssignedSet(supabase: Supabase, orderId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('order_talents')
    .select('talent_id')
    .eq('order_id', orderId);
  return new Set((data ?? []).map((r) => r.talent_id));
}

async function loadCandidatesByServiceFilter(
  supabase: Supabase,
  serviceId: string | null,
  countryId: string | null,
): Promise<Set<string>> {
  if (!serviceId) return new Set();
  let q = supabase.from('talent_services').select('talent_id').eq('service_id', serviceId);
  if (countryId) q = q.eq('country_id', countryId);
  const { data } = await q;
  return new Set((data ?? []).map((r) => r.talent_id));
}

async function loadTalentRows(
  supabase: Supabase,
  args: {
    countryId: string | null;
    cityId: string | null;
    candidatesByService: Set<string> | null;
  },
): Promise<TalentRow[]> {
  let q = supabase
    .from('talent_profiles')
    .select(
      'id, user_id, status, country_id, city_id, profiles!talent_profiles_user_id_fkey(id, full_name, email, phone, address)',
    )
    .not('status', 'in', `(${HIDDEN_TALENT_STATUSES.join(',')})`);
  if (args.countryId) q = q.eq('country_id', args.countryId);
  if (args.cityId) q = q.eq('city_id', args.cityId);
  if (args.candidatesByService) {
    if (args.candidatesByService.size === 0) return [];
    q = q.in('id', Array.from(args.candidatesByService));
  }
  const { data } = await q;
  return (data ?? []) as unknown as TalentRow[];
}

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

async function loadRegisteredServicesCount(
  supabase: Supabase,
  candidateIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (candidateIds.length === 0) return map;
  const { data } = await supabase
    .from('talent_services')
    .select('talent_id, service_id')
    .in('talent_id', candidateIds);
  const seen = new Set<string>();
  for (const r of data ?? []) {
    const key = `${r.talent_id}:${r.service_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    map.set(r.talent_id, (map.get(r.talent_id) ?? 0) + 1);
  }
  return map;
}

async function loadGeoNames(
  supabase: Supabase,
  candidates: TalentRow[],
  locale: string,
): Promise<{ countries: Map<string, string>; cities: Map<string, string> }> {
  const countryIds = Array.from(
    new Set(candidates.map((c) => c.country_id).filter((id): id is string => !!id)),
  );
  const cityIds = Array.from(
    new Set(candidates.map((c) => c.city_id).filter((id): id is string => !!id)),
  );

  const [countriesRes, citiesRes] = await Promise.all([
    countryIds.length > 0
      ? supabase.from('countries').select('id, code, i18n').in('id', countryIds)
      : Promise.resolve({ data: [] }),
    cityIds.length > 0
      ? supabase.from('cities').select('id, i18n').in('id', cityIds)
      : Promise.resolve({ data: [] }),
  ]);

  const countries = new Map<string, string>();
  for (const c of countriesRes.data ?? []) {
    countries.set(c.id, localizedField(c.i18n as I18nRecord, locale, 'name') ?? c.code ?? c.id);
  }
  const cities = new Map<string, string>();
  for (const c of citiesRes.data ?? []) {
    cities.set(c.id, localizedField(c.i18n as I18nRecord, locale, 'name') ?? '');
  }
  return { countries, cities };
}

// ── Build + post-filter ─────────────────────────────────────────────────

type BuildArgs = {
  qualifiedSet: Set<string>;
  statsByUser: Map<string, { ratings: number[]; completed: number }>;
  registeredCounts: Map<string, number>;
  countryNameById: Map<string, string>;
  cityNameById: Map<string, string>;
};

function buildResult(r: TalentRow, args: BuildArgs): TalentSearchResult {
  const stats = args.statsByUser.get(r.user_id) ?? { ratings: [], completed: 0 };
  const ratingAvg =
    stats.ratings.length === 0
      ? null
      : stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length;
  const address = (r.profiles?.address as AddressShape | null) ?? null;
  const postal = address?.postal_code?.trim() ?? '';
  return {
    id: r.id,
    user_id: r.user_id,
    full_name: r.profiles?.full_name ?? null,
    email: r.profiles?.email ?? null,
    phone: r.profiles?.phone ?? null,
    rating_avg: ratingAvg,
    rating_count: stats.ratings.length,
    completed_count: stats.completed,
    is_qualified: args.qualifiedSet.has(r.id),
    country_id: r.country_id,
    country_name: r.country_id ? args.countryNameById.get(r.country_id) ?? null : null,
    city_id: r.city_id,
    city_name: r.city_id ? args.cityNameById.get(r.city_id) ?? null : null,
    postal_code: postal === '' ? null : postal,
    registered_services_count: args.registeredCounts.get(r.id) ?? 0,
  };
}

function applyPostFiltersAndSort(
  rows: TalentSearchResult[],
  filters: TalentSearchFilters,
): TalentSearchResult[] {
  const postalNeedle = filters.postalCode.trim().toLowerCase();
  const nameNeedle = filters.query.trim().toLowerCase();

  const filtered = rows.filter((r) => {
    if (postalNeedle) {
      const haystack = (r.postal_code ?? '').toLowerCase();
      if (!haystack.startsWith(postalNeedle)) return false;
    }
    if (nameNeedle) {
      const haystack = (r.full_name ?? '').toLowerCase();
      if (!haystack.includes(nameNeedle)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (a.is_qualified !== b.is_qualified) return a.is_qualified ? -1 : 1;
    const aRating = a.rating_avg ?? -1;
    const bRating = b.rating_avg ?? -1;
    if (aRating !== bRating) return bRating - aRating;
    if (a.completed_count !== b.completed_count) return b.completed_count - a.completed_count;
    return (a.full_name ?? '').localeCompare(b.full_name ?? '');
  });

  return filtered;
}
