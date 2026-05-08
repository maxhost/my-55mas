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

/**
 * Status of a freshly-registered talent. Re-exports the canonical default
 * from `shared/lib/domain-defaults` typed as `TalentStatus`.
 */
import { INITIAL_TALENT_STATUS as INITIAL_TALENT_STATUS_RAW } from '@/shared/lib/domain-defaults';
export const INITIAL_TALENT_STATUS: TalentStatus = INITIAL_TALENT_STATUS_RAW as TalentStatus;

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
