import { describe, it, expect } from 'vitest';
import { buildNameMap, buildTeamsMap } from '../list-members-helpers';
import type { I18nRow, TeamMemberRow } from '../list-members-helpers';

describe('buildNameMap', () => {
  it('returns empty map for empty input', () => {
    expect(buildNameMap([], 'es')).toEqual(new Map());
  });

  it('maps id to localized name in the requested locale', () => {
    const rows: I18nRow[] = [
      { id: 'c1', i18n: { es: { name: 'España' }, en: { name: 'Spain' } } },
      { id: 'c2', i18n: { es: { name: 'Portugal' } } },
    ];
    expect(buildNameMap(rows, 'es').get('c1')).toBe('España');
    expect(buildNameMap(rows, 'en').get('c1')).toBe('Spain');
    expect(buildNameMap(rows, 'es').get('c2')).toBe('Portugal');
  });

  it('skips rows with null id or empty i18n', () => {
    const rows: I18nRow[] = [
      { id: null, i18n: { es: { name: 'Unknown' } } },
      { id: 'c1', i18n: null },
    ];
    expect(buildNameMap(rows, 'es').size).toBe(0);
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
