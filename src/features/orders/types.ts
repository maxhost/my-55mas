// ── Order Status ────────────────────────────────────

export const ORDER_STATUSES = [
  'pendiente',
  'asignado',
  'confirmado',
  'completado',
  'pendiente_de_pago',
  'terminado',
  'rechazado',
  'archivado',
  'cancelado',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Status of a freshly-created order. Re-exports the canonical default
 * from `shared/lib/domain-defaults` typed as `OrderStatus` so feature
 * consumers get type narrowing.
 */
import { INITIAL_ORDER_STATUS as INITIAL_ORDER_STATUS_RAW } from '@/shared/lib/domain-defaults';
export const INITIAL_ORDER_STATUS: OrderStatus = INITIAL_ORDER_STATUS_RAW as OrderStatus;

/**
 * Statuses considered "archived". The `/admin/archive` listing scopes
 * results to this set, and the archive detail renders read-only while the
 * order is in any of these.
 */
export const ARCHIVE_STATUSES = [
  'archivado',
  'terminado',
  'cancelado',
  'rechazado',
] as const satisfies readonly OrderStatus[];

export type ArchiveStatus = (typeof ARCHIVE_STATUSES)[number];

export function isArchiveStatus(status: OrderStatus): status is ArchiveStatus {
  return (ARCHIVE_STATUSES as readonly OrderStatus[]).includes(status);
}

export const ORDER_SCHEDULE_TYPES = [
  'once',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
] as const;

export type OrderScheduleType = (typeof ORDER_SCHEDULE_TYPES)[number];

// ── Order List Item ────────────────────────────────

export type OrderListItem = {
  id: string;
  order_number: number;
  service_name: string | null;
  client_name: string | null;
  appointment_date: string | null;
  /** IANA service timezone snapshotted at order creation. */
  timezone: string;
  schedule_type: 'once' | 'weekly';
  staff_member_name: string | null;
  talent_name: string | null;
  status: OrderStatus;
  country_id: string;
  city_id: string | null;
  talent_id: string | null;
  client_id: string;
};

// ── Filter Options ──────────────────────────────────

export type CountryOption = { id: string; name: string };
export type CityOption = { id: string; name: string; country_id: string };
export type PersonOption = { id: string; name: string };
