import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type {
  OrderClientSummary,
  OrderDetail,
  OrderPaymentStatus,
  OrderTagOption,
  StaffMemberSummary,
} from '../types';
import type { OrderStatus, OrderScheduleType } from '../../types';

type OrderRow = {
  id: string;
  order_number: number;
  service_id: string | null;
  status: string;
  payment_status: string | null;
  appointment_date: string | null;
  schedule_type: string;
  price_total: number | string;
  price_subtotal: number | string;
  price_tax: number | string;
  price_tax_rate: number | string;
  currency: string;
  staff_member_id: string | null;
  client_id: string;
  talents_needed: number;
  created_at: string | null;
  updated_at: string | null;
};

type ServiceRow = { id: string; slug: string; i18n: unknown } | null;
type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
} | null;

const DEFAULT_DURATION_MIN = 60;

export function composeOrderDetail(args: {
  order: OrderRow;
  service: ServiceRow;
  client: ProfileRow;
  staffMember: ProfileRow;
  tags: OrderTagOption[];
  scheduleSummary: string;
  locale: string;
}): OrderDetail {
  const { order, service, client, staffMember, tags, scheduleSummary, locale } = args;

  const start = order.appointment_date ? new Date(order.appointment_date) : null;
  const end = start ? new Date(start.getTime() + DEFAULT_DURATION_MIN * 60_000) : null;

  return {
    id: order.id,
    order_number: order.order_number,
    service_id: order.service_id,
    service_name: service
      ? localizedField(service.i18n as I18nRecord, locale, 'name') ?? service.slug
      : null,
    status: order.status as OrderStatus,
    payment_status: (order.payment_status as OrderPaymentStatus | null) ?? null,
    appointment_date: order.appointment_date,
    schedule_type: order.schedule_type as OrderScheduleType,
    schedule_summary: scheduleSummary,
    estimated_duration_minutes: DEFAULT_DURATION_MIN,
    start_time: start ? formatTime(start) : null,
    end_time: end ? formatTime(end) : null,
    price_total: Number(order.price_total),
    price_subtotal: Number(order.price_subtotal),
    price_tax: Number(order.price_tax),
    price_tax_rate: Number(order.price_tax_rate),
    currency: order.currency,
    created_at: order.created_at,
    updated_at: order.updated_at,
    staff_member: composeStaff(staffMember),
    client: composeClient(client, order.client_id),
    tags,
    talents_needed: order.talents_needed ?? 1,
  };
}

function composeStaff(profile: ProfileRow): StaffMemberSummary | null {
  if (!profile) return null;
  return { id: profile.id, full_name: profile.full_name };
}

function composeClient(profile: ProfileRow, clientId: string): OrderClientSummary {
  return {
    id: clientId,
    full_name: profile?.full_name ?? null,
    email: profile?.email ?? null,
    phone: profile?.phone ?? null,
  };
}

function formatTime(d: Date): string {
  return d.toISOString().substring(11, 16); // HH:mm in UTC; client adjusts via Intl
}
