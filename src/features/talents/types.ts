// ── Talent Status ────────────────────────────────────

export const TALENT_STATUSES = [
  'registered',
  'evaluation',
  'active',
  'archived',
  'excluded',
  'inactive',
] as const;
export type TalentStatus = (typeof TALENT_STATUSES)[number];

// ── Service Chip (for talent list) ──────────────────

export type TalentServiceChip = {
  name: string;
};

// ── Talent List Item ────────────────────────────────

export type TalentListItem = {
  id: string;
  user_id: string;
  full_name: string | null;
  country_id: string | null;
  country_name: string | null;
  city_id: string | null;
  city_name: string | null;
  services: TalentServiceChip[];
  total_earned_eur: number;
  status: TalentStatus;
  created_at: string | null;
};

// ── Filter Options ──────────────────────────────────

export type CountryOption = { id: string; name: string };
export type CityOption = { id: string; name: string; country_id: string };
