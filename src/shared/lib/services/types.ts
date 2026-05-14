import type { AssignedSubtypeGroup, Question } from '@/shared/lib/questions/types';

// ── Service category ─────────────────────────────────────
// Bucket fijo del home (Acompañamiento / Clases / Reparaciones / Casa).
// Matchea el enum `service_category` definido en
// `supabase/migrations/20260514_services_category_column.sql`.

export const SERVICE_CATEGORIES = [
  'accompaniment',
  'classes',
  'repairs',
  'home',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

/**
 * A service published in a country, ready to be presented to a talent for hire.
 * Includes the suggested price (city-specific override → country fallback) and
 * the talent_questions + assigned subtype groups so a wizard step can render them.
 */
export type AvailableService = {
  id: string;
  name: string;
  slug: string;
  talent_questions: Question[];
  assignedGroups: AssignedSubtypeGroup[];
  /** service_cities.base_price for the talent's city, or service_countries.base_price as fallback. null if neither configured. */
  suggested_price: number | null;
};
