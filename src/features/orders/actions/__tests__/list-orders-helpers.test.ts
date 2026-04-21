import { describe, it, expect } from 'vitest';
import {
  buildNameMap,
  buildServiceNameMap,
  buildProfileNameMap,
  buildStaffNameMap,
} from '../list-orders-helpers';

describe('buildNameMap', () => {
  it('creates a map from id/name rows', () => {
    const rows = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ];
    const map = buildNameMap(rows);
    expect(map.get('a')).toBe('Alpha');
    expect(map.get('b')).toBe('Beta');
    expect(map.size).toBe(2);
  });

  it('returns empty map for empty input', () => {
    expect(buildNameMap([]).size).toBe(0);
  });
});

describe('buildServiceNameMap', () => {
  it('maps service_id to name', () => {
    const rows = [{ service_id: 's1', name: 'Cleaning' }];
    const map = buildServiceNameMap(rows);
    expect(map.get('s1')).toBe('Cleaning');
  });
});

describe('buildProfileNameMap', () => {
  it('maps id to full_name, skipping nulls', () => {
    const rows = [
      { id: 'p1', full_name: 'Ana García' },
      { id: 'p2', full_name: null },
    ];
    const map = buildProfileNameMap(rows);
    expect(map.get('p1')).toBe('Ana García');
    expect(map.has('p2')).toBe(false);
  });
});

describe('buildStaffNameMap', () => {
  it('concatenates first and last name', () => {
    const rows = [{ id: 's1', first_name: 'Elena', last_name: 'Parras' }];
    const map = buildStaffNameMap(rows);
    expect(map.get('s1')).toBe('Elena Parras');
  });

  it('handles null first or last name', () => {
    const rows = [
      { id: 's1', first_name: 'Joana', last_name: null },
      { id: 's2', first_name: null, last_name: 'Teixeira' },
    ];
    const map = buildStaffNameMap(rows);
    expect(map.get('s1')).toBe('Joana');
    expect(map.get('s2')).toBe('Teixeira');
  });

  it('skips entries where both names are null', () => {
    const rows = [{ id: 's1', first_name: null, last_name: null }];
    const map = buildStaffNameMap(rows);
    expect(map.size).toBe(0);
  });
});
