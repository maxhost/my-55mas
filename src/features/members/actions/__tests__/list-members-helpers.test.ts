import { describe, it, expect } from 'vitest';
import { buildNameMap, buildTeamsMap } from '../list-members-helpers';
import type { LocalizedRow, TeamMemberRow } from '../list-members-helpers';

describe('buildNameMap', () => {
  it('returns empty map for empty input', () => {
    expect(buildNameMap([])).toEqual(new Map());
  });

  it('maps id to name', () => {
    const rows: LocalizedRow[] = [
      { id: 'c1', name: 'España' },
      { id: 'c2', name: 'Portugal' },
    ];
    const map = buildNameMap(rows);
    expect(map.get('c1')).toBe('España');
    expect(map.get('c2')).toBe('Portugal');
  });

  it('skips rows with null id or name', () => {
    const rows: LocalizedRow[] = [
      { id: null, name: 'Unknown' },
      { id: 'c1', name: null },
    ];
    expect(buildNameMap(rows).size).toBe(0);
  });
});

describe('buildTeamsMap', () => {
  it('returns empty map for empty input', () => {
    expect(buildTeamsMap([])).toEqual(new Map());
  });

  it('groups teams by user_id', () => {
    const rows: TeamMemberRow[] = [
      { user_id: 'u1', team_id: 't1', teams: { id: 't1', name: 'Marketing' } },
      { user_id: 'u1', team_id: 't2', teams: { id: 't2', name: 'Support' } },
      { user_id: 'u2', team_id: 't1', teams: { id: 't1', name: 'Marketing' } },
    ];
    const map = buildTeamsMap(rows);

    expect(map.get('u1')).toEqual([
      { id: 't1', name: 'Marketing' },
      { id: 't2', name: 'Support' },
    ]);
    expect(map.get('u2')).toEqual([{ id: 't1', name: 'Marketing' }]);
  });

  it('skips rows with null teams', () => {
    const rows: TeamMemberRow[] = [
      { user_id: 'u1', team_id: 't1', teams: null },
    ];
    expect(buildTeamsMap(rows).size).toBe(0);
  });
});
