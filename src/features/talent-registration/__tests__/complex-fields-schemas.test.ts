import { describe, it, expect } from 'vitest';
import {
  addressSchema,
  cityIdSchema,
  countryIdSchema,
  fiscalIdSchema,
  fiscalIdTypeIdSchema,
  phoneSchema,
} from '../fields/schemas';

describe('phoneSchema', () => {
  it('accepts a valid Spanish phone in E.164', () => {
    expect(phoneSchema.safeParse('+34612345678').success).toBe(true);
  });
  it('rejects empty string', () => {
    expect(phoneSchema.safeParse('').success).toBe(false);
  });
  it('rejects malformed phone', () => {
    expect(phoneSchema.safeParse('not-a-phone').success).toBe(false);
  });
});

describe('countryIdSchema / cityIdSchema', () => {
  it('accepts a valid uuid', () => {
    expect(countryIdSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
    expect(cityIdSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
  });
  it('rejects non-uuid', () => {
    expect(countryIdSchema.safeParse('abc').success).toBe(false);
  });
});

describe('addressSchema', () => {
  it('accepts a complete address', () => {
    expect(
      addressSchema.safeParse({
        street: 'Calle Mayor 1',
        postal_code: '28013',
        lat: 40.4168,
        lng: -3.7038,
        mapbox_id: 'addr_xyz',
        raw_text: 'Calle Mayor 1, 28013 Madrid',
        country_code: 'es',
        city_name: 'Madrid',
      }).success,
    ).toBe(true);
  });
  it('accepts an address without coordinates (Mapbox failed gracefully)', () => {
    expect(
      addressSchema.safeParse({
        street: 'Calle Mayor 1',
        postal_code: '',
        lat: null,
        lng: null,
        mapbox_id: null,
        raw_text: 'Calle Mayor 1',
        country_code: '',
        city_name: '',
      }).success,
    ).toBe(true);
  });
  it('rejects empty street', () => {
    expect(
      addressSchema.safeParse({
        street: '',
        postal_code: '',
        lat: null,
        lng: null,
        mapbox_id: null,
        raw_text: 'fallback',
        country_code: '',
        city_name: '',
      }).success,
    ).toBe(false);
  });
  it('rejects empty raw_text', () => {
    expect(
      addressSchema.safeParse({
        street: 'something',
        postal_code: '',
        lat: null,
        lng: null,
        mapbox_id: null,
        raw_text: '',
        country_code: '',
        city_name: '',
      }).success,
    ).toBe(false);
  });
});

describe('fiscalIdSchema / fiscalIdTypeIdSchema', () => {
  it('accepts a valid fiscal id', () => {
    expect(fiscalIdSchema.safeParse('12345678X').success).toBe(true);
  });
  it('rejects too short', () => {
    expect(fiscalIdSchema.safeParse('123').success).toBe(false);
  });
  it('rejects too long', () => {
    expect(fiscalIdSchema.safeParse('a'.repeat(51)).success).toBe(false);
  });
  it('typeId requires uuid', () => {
    expect(fiscalIdTypeIdSchema.safeParse('not-uuid').success).toBe(false);
  });
});
