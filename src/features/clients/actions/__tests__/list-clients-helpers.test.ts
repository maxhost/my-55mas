import { describe, it, expect } from 'vitest';
import { buildNameMap } from '../list-clients-helpers';
import type { I18nRow } from '../list-clients-helpers';

describe('buildNameMap', () => {
  it('returns empty map for empty input', () => {
    expect(buildNameMap([], 'es')).toEqual(new Map());
  });

  it('maps id to localized name in requested locale', () => {
    const rows: I18nRow[] = [
      { id: 'c1', i18n: { es: { name: 'España' }, en: { name: 'Spain' } } },
      { id: 'c2', i18n: { es: { name: 'Portugal' }, en: { name: 'Portugal' } } },
    ];

    expect(buildNameMap(rows, 'es').get('c1')).toBe('España');
    expect(buildNameMap(rows, 'en').get('c1')).toBe('Spain');
  });

  it('falls back to es when locale missing', () => {
    const rows: I18nRow[] = [{ id: 'c1', i18n: { es: { name: 'España' } } }];

    expect(buildNameMap(rows, 'fr').get('c1')).toBe('España');
  });

  it('skips rows with null id', () => {
    const rows: I18nRow[] = [
      { id: null, i18n: { es: { name: 'Unknown' } } },
      { id: 'c1', i18n: { es: { name: 'España' } } },
    ];
    const map = buildNameMap(rows, 'es');

    expect(map.size).toBe(1);
    expect(map.get('c1')).toBe('España');
  });

  it('skips rows with empty i18n', () => {
    const rows: I18nRow[] = [
      { id: 'c1', i18n: null },
      { id: 'c2', i18n: { es: { name: 'Portugal' } } },
    ];
    const map = buildNameMap(rows, 'es');

    expect(map.size).toBe(1);
    expect(map.get('c2')).toBe('Portugal');
  });
});
