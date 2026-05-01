import { describe, it, expect } from 'vitest';
import { buildServicesMap, buildEarningsMap, buildNameMap } from '../list-talents-helpers';
import type { TalentServiceRow, OrderRow, I18nRow } from '../list-talents-helpers';

// ── buildServicesMap ────────────────────────────────

describe('buildServicesMap', () => {
  it('returns empty map for empty input', () => {
    expect(buildServicesMap([])).toEqual(new Map());
  });

  it('groups services by talent_id', () => {
    const rows: TalentServiceRow[] = [
      { talent_id: 't1', service_name: 'Limpieza' },
      { talent_id: 't1', service_name: 'Cocina' },
      { talent_id: 't2', service_name: 'Jardinería' },
    ];
    const map = buildServicesMap(rows);

    expect(map.get('t1')).toEqual([{ name: 'Limpieza' }, { name: 'Cocina' }]);
    expect(map.get('t2')).toEqual([{ name: 'Jardinería' }]);
  });

  it('deduplicates services with the same name', () => {
    const rows: TalentServiceRow[] = [
      { talent_id: 't1', service_name: 'Limpieza' },
      { talent_id: 't1', service_name: 'Limpieza' },
    ];
    const map = buildServicesMap(rows);

    expect(map.get('t1')).toEqual([{ name: 'Limpieza' }]);
  });

  it('skips rows with null service_name', () => {
    const rows: TalentServiceRow[] = [
      { talent_id: 't1', service_name: null },
      { talent_id: 't1', service_name: 'Cocina' },
    ];
    const map = buildServicesMap(rows);

    expect(map.get('t1')).toEqual([{ name: 'Cocina' }]);
  });

  it('returns empty for talent with only null names', () => {
    const rows: TalentServiceRow[] = [
      { talent_id: 't1', service_name: null },
    ];
    const map = buildServicesMap(rows);

    expect(map.has('t1')).toBe(false);
  });
});

// ── buildNameMap ────────────────────────────────────

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

  it('falls back to es when locale missing', () => {
    const rows: I18nRow[] = [{ id: 'c1', i18n: { es: { name: 'España' } } }];
    expect(buildNameMap(rows, 'pt').get('c1')).toBe('España');
  });

  it('skips rows with null id or empty i18n', () => {
    const rows: I18nRow[] = [
      { id: null, i18n: { es: { name: 'Unknown' } } },
      { id: 'c1', i18n: null },
      { id: 'c2', i18n: { es: { name: 'Francia' } } },
    ];
    const map = buildNameMap(rows, 'es');
    expect(map.size).toBe(1);
    expect(map.get('c2')).toBe('Francia');
  });
});

// ── buildEarningsMap ────────────────────────────────

describe('buildEarningsMap', () => {
  it('returns empty map for empty input', () => {
    expect(buildEarningsMap([])).toEqual(new Map());
  });

  it('sums price_total per talent', () => {
    const rows: OrderRow[] = [
      { talent_id: 't1', price_total: 100 },
      { talent_id: 't1', price_total: 50 },
      { talent_id: 't2', price_total: 200 },
    ];
    const map = buildEarningsMap(rows);

    expect(map.get('t1')).toBe(150);
    expect(map.get('t2')).toBe(200);
  });

  it('skips rows with null talent_id', () => {
    const rows: OrderRow[] = [
      { talent_id: null, price_total: 100 },
      { talent_id: 't1', price_total: 50 },
    ];
    const map = buildEarningsMap(rows);

    expect(map.has('null')).toBe(false);
    expect(map.get('t1')).toBe(50);
  });
});
