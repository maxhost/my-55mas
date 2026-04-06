// ── Staff Role ───────────────────────────────────────

export const STAFF_ROLES = ['admin', 'manager', 'viewer'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

// ── Member List Item ────────────────────────────────

export type MemberTeamChip = {
  id: string;
  name: string;
};

export type MemberListItem = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: StaffRole;
  role_display_name: string;
  country_id: string | null;
  country_name: string | null;
  city_id: string | null;
  city_name: string | null;
  teams: MemberTeamChip[];
  created_at: string | null;
};

// ── Filter Options ──────────────────────────────────

export type CountryOption = { id: string; name: string };
export type CityOption = { id: string; name: string; country_id: string };
export type TeamOption = { id: string; name: string };
export type RoleOption = { key: string; display_name: string };
