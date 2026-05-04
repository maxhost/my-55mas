import type { AssignedSubtypeGroup, Question } from '@/shared/lib/questions/types';

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
