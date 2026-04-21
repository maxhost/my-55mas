// ── Order Status ────────────────────────────────────

export const ORDER_STATUSES = [
  'nuevo',
  'buscando_talento',
  'asignado',
  'en_curso',
  'completado',
  'cancelado',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ── Order List Item ────────────────────────────────

export type OrderListItem = {
  id: string;
  order_number: number;
  service_name: string | null;
  client_name: string | null;
  appointment_date: string | null;
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
