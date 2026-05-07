'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import { getClientOrdersSchema } from '../schemas';
import type { ClientOrderRow, ClientOrdersPage } from '../types';

/**
 * Lists orders for a client, paginated server-side. Joins service name (i18n)
 * and talent display name (profiles.full_name where orders.talent_id =
 * profiles.user_id).
 *
 * Filters: status, fromDate/toDate, search (matches order_number or service
 * name through a follow-up filter — see Search note).
 *
 * Search note: Postgres `or()` with a text cast on order_number works for
 * exact prefixes; a true full-text search across joined service names would
 * need a derived view. For Phase 2 we only filter by order_number prefix +
 * fall back to letting the client side narrow visually.
 */
export async function getClientOrders(
  input: unknown,
  locale: string,
): Promise<ClientOrdersPage> {
  const parsed = getClientOrdersSchema.safeParse(input);
  if (!parsed.success) return { rows: [], totalCount: 0 };
  const { clientId, page, pageSize, status, fromDate, toDate, search } = parsed.data;

  const supabase = createClient();

  const { data: cp } = await supabase
    .from('client_profiles')
    .select('user_id')
    .eq('id', clientId)
    .maybeSingle();
  if (!cp) return { rows: [], totalCount: 0 };

  let q = supabase
    .from('orders')
    .select(
      'id, order_number, appointment_date, service_id, talent_id, status, payment_status, price_total, currency',
      { count: 'exact' },
    )
    .eq('client_id', cp.user_id);

  if (status) q = q.eq('status', status);
  if (fromDate) q = q.gte('appointment_date', fromDate);
  if (toDate) q = q.lte('appointment_date', toDate);
  if (search) {
    const trimmed = search.trim();
    if (/^\d+$/.test(trimmed)) {
      q = q.eq('order_number', Number(trimmed));
    }
    // Non-numeric search is ignored server-side for Phase 2 (we'd need a
    // derived view to text-search the joined service name efficiently).
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  q = q.order('appointment_date', { ascending: false, nullsFirst: false }).range(from, to);

  const { data: orders, count } = await q;
  if (!orders || orders.length === 0) return { rows: [], totalCount: count ?? 0 };

  const serviceIds = Array.from(
    new Set(orders.map((o) => o.service_id).filter((s): s is string => !!s)),
  );
  const talentIds = Array.from(
    new Set(orders.map((o) => o.talent_id).filter((t): t is string => !!t)),
  );

  const [servicesRes, talentsRes] = await Promise.all([
    serviceIds.length > 0
      ? supabase.from('services').select('id, slug, i18n').in('id', serviceIds)
      : Promise.resolve({ data: [] }),
    talentIds.length > 0
      ? supabase.from('profiles').select('id, full_name').in('id', talentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const serviceNames = new Map<string, string>(
    (servicesRes.data ?? []).map((s) => [
      s.id,
      localizedField(s.i18n as I18nRecord, locale, 'name') ?? s.slug,
    ]),
  );
  const talentNames = new Map<string, string>(
    (talentsRes.data ?? []).map((t) => [t.id, t.full_name ?? '']),
  );

  const rows: ClientOrderRow[] = orders.map((o) => ({
    id: o.id,
    order_number: o.order_number,
    appointment_date: o.appointment_date,
    service_name: o.service_id ? serviceNames.get(o.service_id) ?? null : null,
    talent_name: o.talent_id ? talentNames.get(o.talent_id) ?? null : null,
    status: o.status,
    payment_status: o.payment_status,
    price_total: o.price_total === null ? null : Number(o.price_total),
    currency: o.currency,
  }));

  return { rows, totalCount: count ?? 0 };
}
