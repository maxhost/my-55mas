import { describe, it, expect } from 'vitest';
import { computeCountryRows, canPublish } from '../config-helpers';
import type { CityPriceInput } from '../../schemas';

function city(
  overrides: Partial<CityPriceInput> & { city_id: string; country_id: string },
): CityPriceInput {
  return {
    base_price: 25,
    is_active: true,
    ...overrides,
  };
}

// ── computeCountryRows ────────────────────────────────

describe('computeCountryRows', () => {
  it('sets is_active=true when ≥1 city is active in that country', () => {
    const result = computeCountryRows(
      ['c1'],
      { c1: 20 },
      [city({ city_id: 'a', country_id: 'c1', is_active: true })],
    );
    expect(result).toEqual([
      { country_id: 'c1', base_price: 20, is_active: true },
    ]);
  });

  it('sets is_active=false when all cities in country are inactive', () => {
    const result = computeCountryRows(
      ['c1'],
      { c1: 20 },
      [
        city({ city_id: 'a', country_id: 'c1', is_active: false }),
        city({ city_id: 'b', country_id: 'c1', is_active: false }),
      ],
    );
    expect(result[0].is_active).toBe(false);
  });

  it('sets is_active=false when country has no cities', () => {
    const result = computeCountryRows(['c1'], { c1: 20 }, []);
    expect(result[0].is_active).toBe(false);
  });

  it('uses templatePrice as base_price for each country', () => {
    const result = computeCountryRows(
      ['c1', 'c2'],
      { c1: 15, c2: 30 },
      [city({ city_id: 'a', country_id: 'c1' })],
    );
    expect(result[0].base_price).toBe(15);
    expect(result[1].base_price).toBe(30);
  });

  it('handles multiple countries correctly', () => {
    const result = computeCountryRows(
      ['c1', 'c2'],
      { c1: 10, c2: 20 },
      [
        city({ city_id: 'a', country_id: 'c1', is_active: true }),
        city({ city_id: 'b', country_id: 'c2', is_active: false }),
      ],
    );
    expect(result).toEqual([
      { country_id: 'c1', base_price: 10, is_active: true },
      { country_id: 'c2', base_price: 20, is_active: false },
    ]);
  });

  it('preserves country order from configuredCountryIds', () => {
    const result = computeCountryRows(
      ['c2', 'c1'],
      { c1: 10, c2: 20 },
      [city({ city_id: 'a', country_id: 'c1' })],
    );
    expect(result[0].country_id).toBe('c2');
    expect(result[1].country_id).toBe('c1');
  });
});

// ── canPublish ────────────────────────────────────────

describe('canPublish', () => {
  it('returns true when ≥1 city active with price > 0', () => {
    expect(
      canPublish([city({ city_id: 'a', country_id: 'c1', base_price: 25, is_active: true })]),
    ).toBe(true);
  });

  it('returns false when no cities configured', () => {
    expect(canPublish([])).toBe(false);
  });

  it('returns false when all cities have price 0', () => {
    expect(
      canPublish([city({ city_id: 'a', country_id: 'c1', base_price: 0, is_active: true })]),
    ).toBe(false);
  });

  it('returns false when all cities are inactive', () => {
    expect(
      canPublish([city({ city_id: 'a', country_id: 'c1', base_price: 25, is_active: false })]),
    ).toBe(false);
  });

  it('returns true if at least one city meets criteria among many', () => {
    expect(
      canPublish([
        city({ city_id: 'a', country_id: 'c1', base_price: 0, is_active: true }),
        city({ city_id: 'b', country_id: 'c1', base_price: 25, is_active: false }),
        city({ city_id: 'c', country_id: 'c2', base_price: 30, is_active: true }),
      ]),
    ).toBe(true);
  });
});
