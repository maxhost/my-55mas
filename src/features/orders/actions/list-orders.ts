'use server';

import { createClient } from '@/lib/supabase/server';
import {
  buildNameMap,
  buildServiceNameMap,
  buildProfileNameMap,
  buildStaffNameMap,
} from './list-orders-helpers';
import type { OrderListItem, OrderStatus } from '../types';

type ListOrdersParams = {
  locale: string;
  /** Restrict results to these statuses. Empty/undefined = all statuses. */
  statuses?: OrderStatus[];
};

type OrderRow = {
  id: string;
  order_number: number;
  client_id: string;
  talent_id: string | null;
  staff_member_id: string | null;
  service_id: string | null;
  country_id: string;
  service_city_id: string | null;
  status: string;
  schedule_type: string;
  appointment_date: string | null;
};

const PAGE_SIZE = 1000;

export async function listOrders({
  locale,
  statuses,
}: ListOrdersParams): Promise<OrderListItem[]> {
  const supabase = createClient();

  // Step 1: paginated fetch
  const orders: OrderRow[] = [];
  let from = 0;
  while (true) {
    let query = supabase
      .from('orders')
      .select(
        'id, order_number, client_id, talent_id, staff_member_id, service_id, country_id, service_city_id, status, schedule_type, appointment_date',
      )
      .order('order_number', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses);
    }
    const { data: page, error } = await query;

    if (error) throw error;
    if (!page || page.length === 0) break;
    orders.push(...(page as unknown as OrderRow[]));
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  if (orders.length === 0) return [];

  // Step 2: collect unique FK IDs
  const clientIds = Array.from(new Set(orders.map((o) => o.client_id)));
  const talentIds = Array.from(new Set(orders.map((o) => o.talent_id).filter(Boolean))) as string[];
  const staffIds = Array.from(new Set(orders.map((o) => o.staff_member_id).filter(Boolean))) as string[];
  const serviceIds = Array.from(new Set(orders.map((o) => o.service_id).filter(Boolean))) as string[];

  // Step 3: parallel name resolution
  const [clientsRes, talentsRes, staffRes, servicesRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', clientIds),
    talentIds.length > 0
      ? supabase.from('profiles').select('id, full_name').in('id', talentIds)
      : Promise.resolve({ data: [], error: null }),
    staffIds.length > 0
      ? supabase.from('staff_profiles').select('id, first_name, last_name').in('id', staffIds)
      : Promise.resolve({ data: [], error: null }),
    serviceIds.length > 0
      ? supabase.from('services').select('id, slug, i18n').in('id', serviceIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (talentsRes.error) throw talentsRes.error;
  if (staffRes.error) throw staffRes.error;
  if (servicesRes.error) throw servicesRes.error;

  const clientMap = buildProfileNameMap(clientsRes.data ?? []);
  const talentMap = buildProfileNameMap((talentsRes.data ?? []) as { id: string; full_name: string | null }[]);
  const staffMap = buildStaffNameMap(
    (staffRes.data ?? []) as { id: string; first_name: string | null; last_name: string | null }[]
  );
  const serviceMap = buildServiceNameMap(
    (servicesRes.data ?? []) as { id: string; slug: string; i18n: unknown }[],
    locale
  );

  // Step 4: transform
  return orders.map((o) => ({
    id: o.id,
    order_number: o.order_number,
    service_name: o.service_id ? serviceMap.get(o.service_id) ?? null : null,
    client_name: clientMap.get(o.client_id) ?? null,
    appointment_date: o.appointment_date,
    schedule_type: o.schedule_type as 'once' | 'weekly',
    staff_member_name: o.staff_member_id ? staffMap.get(o.staff_member_id) ?? null : null,
    talent_name: o.talent_id ? talentMap.get(o.talent_id) ?? null : null,
    status: o.status as OrderStatus,
    country_id: o.country_id,
    city_id: o.service_city_id,
    talent_id: o.talent_id,
    client_id: o.client_id,
  }));
}
