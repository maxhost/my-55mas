import type { TalentStatus } from '../../types';

/**
 * Returns the list of statuses the admin can move the talent to from the
 * current status. Admins always have all 6 options available — semantics are
 * documented in the spec, not enforced here.
 */
export function allowedNextStatuses(current: TalentStatus): TalentStatus[] {
  const all: TalentStatus[] = [
    'registered',
    'evaluation',
    'active',
    'archived',
    'excluded',
    'inactive',
  ];
  return all.filter((s) => s !== current);
}
