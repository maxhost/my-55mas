'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import { composeOrderDetail } from '../lib/compose-order-detail';
import type { OrderDetail, OrderTagOption } from '../types';

type Supabase = ReturnType<typeof createClient>;

export async function getOrderDetail(
  orderId: string,
  locale: string,
): Promise<OrderDetail | null> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, order_number, service_id, status, payment_status, appointment_date, schedule_type, price_total, price_subtotal, price_tax, price_tax_rate, currency, staff_member_id, client_id, talents_needed, created_at, updated_at',
    )
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return null;

  const [serviceRes, clientRes, staffRes, tagsRes, scheduleSummary] = await Promise.all([
    order.service_id
      ? supabase.from('services').select('id, slug, i18n').eq('id', order.service_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('id', order.client_id)
      .maybeSingle(),
    order.staff_member_id
      ? supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .eq('id', order.staff_member_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('order_tag_assignments')
      .select('tag_id, order_tags(id, slug, i18n)')
      .eq('order_id', orderId),
    composeScheduleSummary(supabase, orderId, order.schedule_type),
  ]);

  const tags: OrderTagOption[] = (tagsRes.data ?? [])
    .map((row) => (row as unknown as { order_tags: { id: string; slug: string; i18n: unknown } | null }).order_tags)
    .filter((t): t is { id: string; slug: string; i18n: unknown } => t !== null)
    .map((t) => ({
      id: t.id,
      name: localizedField(t.i18n as I18nRecord, locale, 'name') ?? t.slug,
    }));

  return composeOrderDetail({
    order: { ...order, talents_needed: order.talents_needed ?? 1 },
    service: serviceRes.data ?? null,
    client: clientRes.data ?? null,
    staffMember: staffRes.data ?? null,
    tags,
    scheduleSummary,
    locale,
  });
}

/**
 * Short summary shown in the header. The Service tab renders the full
 * recurrence breakdown.
 */
async function composeScheduleSummary(
  supabase: Supabase,
  orderId: string,
  scheduleType: string,
): Promise<string> {
  if (scheduleType === 'once') return 'Sesión única';
  const { data } = await supabase
    .from('order_recurrence')
    .select('start_date, end_date')
    .eq('order_id', orderId)
    .maybeSingle();
  if (!data) return 'Recurrente — ver pestaña Servicio';
  const range = [data.start_date, data.end_date].filter(Boolean).join(' → ');
  return range ? `Recurrente · ${range}` : 'Recurrente — ver pestaña Servicio';
}
