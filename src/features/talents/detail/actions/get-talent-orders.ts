'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import { getTalentOrdersSchema } from '../schemas';
import type { TalentOrderRow, TalentOrdersPage } from '../types';

/**
 * Lists orders for a talent, paginated server-side. The query joins the
 * service name (i18n) and the client display name (profiles.full_name OR
 * orders.contact_name as fallback for guest hires).
 *
 * Filters: status, serviceId, fromDate/toDate, search (matches client name or
 * order_number).
 */
export async function getTalentOrders(
  input: unknown,
  locale: string,
): Promise<TalentOrdersPage> {
  const parsed = getTalentOrdersSchema.safeParse(input);
  if (!parsed.success) return { rows: [], totalCount: 0 };
  const { talentId, page, pageSize, status, serviceId, fromDate, toDate, search } = parsed.data;

  const supabase = createClient();

  // talent_id on `orders` references profiles.user_id (per spec); resolve once.
  const { data: talent } = await supabase
    .from('talent_profiles')
    .select('user_id')
    .eq('id', talentId)
    .maybeSingle();
  if (!talent) return { rows: [], totalCount: 0 };

  let q = supabase
    .from('orders')
    .select(
      'id, order_number, appointment_date, timezone, service_id, client_id, status, payment_status, talent_amount, currency, contact_name',
      { count: 'exact' },
    )
    .eq('talent_id', talent.user_id);

  if (status) q = q.eq('status', status);
  if (serviceId) q = q.eq('service_id', serviceId);
  if (fromDate) q = q.gte('appointment_date', fromDate);
  if (toDate) q = q.lte('appointment_date', toDate);
  if (search) q = q.or(`contact_name.ilike.%${search}%,order_number::text.ilike.%${search}%`);

  const from = page * pageSize;
  const to = from + pageSize - 1;
  q = q.order('appointment_date', { ascending: false, nullsFirst: false }).range(from, to);

  const { data: orders, count } = await q;
  if (!orders || orders.length === 0) return { rows: [], totalCount: count ?? 0 };

  const serviceIds = Array.from(new Set(orders.map((o) => o.service_id).filter((s): s is string => !!s)));
  const clientIds = Array.from(new Set(orders.map((o) => o.client_id).filter((c): c is string => !!c)));

  const [servicesRes, clientsRes] = await Promise.all([
    serviceIds.length > 0
      ? supabase.from('services').select('id, slug, i18n').in('id', serviceIds)
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from('profiles').select('id, full_name').in('id', clientIds)
      : Promise.resolve({ data: [] }),
  ]);

  const serviceNames = new Map<string, string>(
    (servicesRes.data ?? []).map((s) => [
      s.id,
      localizedField(s.i18n as I18nRecord, locale, 'name') ?? s.slug,
    ]),
  );
  const clientNames = new Map<string, string>(
    (clientsRes.data ?? []).map((c) => [c.id, c.full_name ?? '']),
  );

  const rows: TalentOrderRow[] = orders.map((o) => ({
    id: o.id,
    order_number: o.order_number,
    appointment_date: o.appointment_date,
    timezone: o.timezone,
    service_name: o.service_id ? serviceNames.get(o.service_id) ?? null : null,
    client_name: (o.client_id ? clientNames.get(o.client_id) : null) || o.contact_name || null,
    status: o.status,
    payment_status: o.payment_status,
    talent_amount: o.talent_amount === null ? null : Number(o.talent_amount),
    currency: o.currency,
  }));

  return { rows, totalCount: count ?? 0 };
}
