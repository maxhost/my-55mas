import { describe, it, expect } from 'vitest';
import { buildNameMap } from '../list-clients-helpers';
import type { LocalizedRow } from '../list-clients-helpers';

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
    expect(map.size).toBe(2);
  });

  it('skips rows with null id', () => {
    const rows: LocalizedRow[] = [
      { id: null, name: 'Unknown' },
      { id: 'c1', name: 'España' },
    ];
    const map = buildNameMap(rows);

    expect(map.size).toBe(1);
    expect(map.get('c1')).toBe('España');
  });

  it('skips rows with null name', () => {
    const rows: LocalizedRow[] = [
      { id: 'c1', name: null },
      { id: 'c2', name: 'Portugal' },
    ];
    const map = buildNameMap(rows);

    expect(map.size).toBe(1);
    expect(map.get('c2')).toBe('Portugal');
  });
});
