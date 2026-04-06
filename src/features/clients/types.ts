// ── Client Status ────────────────────────────────────

export const CLIENT_STATUSES = ['active', 'suspended'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

// ── Client List Item ────────────────────────────────

export type ClientListItem = {
  id: string;
  user_id: string;
  full_name: string | null;
  country_name: string | null;
  country_id: string | null;
  city_name: string | null;
  city_id: string | null;
  company_name: string | null;
  status: ClientStatus;
  created_at: string | null;
};

// ── Filter Options ──────────────────────────────────

export type CountryOption = { id: string; name: string };
export type CityOption = { id: string; name: string; country_id: string };
