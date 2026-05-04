import { describe, it, expect } from 'vitest';
import {
  personalDataSchema,
  contactAddressSchema,
  professionalSituationSchema,
  servicesSectionSchema,
  paymentsSchema,
  languagesSectionSchema,
  saveServicesSchema,
} from '../schemas';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';
const validAddress = {
  street: 'Calle Mayor 1',
  postal_code: '28013',
  lat: 40.4,
  lng: -3.7,
  mapbox_id: 'addr_1',
  raw_text: 'Calle Mayor 1, Madrid, Spain',
  country_code: 'es',
  city_name: 'Madrid',
};

describe('personalDataSchema', () => {
  const longTimeAgo = (years: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - years);
    return d.toISOString().slice(0, 10);
  };

  it('accepts valid male, age >= 55', () => {
    expect(
      personalDataSchema.safeParse({ gender: 'male', birth_date: longTimeAgo(60) }).success,
    ).toBe(true);
  });

  it('rejects under 55', () => {
    expect(
      personalDataSchema.safeParse({ gender: 'female', birth_date: longTimeAgo(40) }).success,
    ).toBe(false);
  });

  it('rejects invalid gender', () => {
    expect(
      personalDataSchema.safeParse({ gender: 'other', birth_date: longTimeAgo(60) }).success,
    ).toBe(false);
  });

  it('rejects malformed date', () => {
    expect(personalDataSchema.safeParse({ gender: 'male', birth_date: '60-01-01' }).success).toBe(
      false,
    );
  });
});

describe('contactAddressSchema', () => {
  it('accepts complete address with city_id', () => {
    expect(
      contactAddressSchema.safeParse({
        preferred_contact: 'whatsapp',
        address: validAddress,
        city_id: validUuid,
      }).success,
    ).toBe(true);
  });

  it('accepts city_id null (manual fallback pending)', () => {
    expect(
      contactAddressSchema.safeParse({
        preferred_contact: 'email',
        address: validAddress,
        city_id: null,
      }).success,
    ).toBe(true);
  });

  it('rejects unknown contact method', () => {
    expect(
      contactAddressSchema.safeParse({
        preferred_contact: 'sms',
        address: validAddress,
        city_id: null,
      }).success,
    ).toBe(false);
  });

  it('rejects empty raw_text', () => {
    expect(
      contactAddressSchema.safeParse({
        preferred_contact: 'phone',
        address: { ...validAddress, raw_text: '' },
        city_id: null,
      }).success,
    ).toBe(false);
  });
});

describe('professionalSituationSchema', () => {
  it('accepts each enum value', () => {
    for (const v of ['pre_retired', 'unemployed', 'employed', 'retired']) {
      expect(
        professionalSituationSchema.safeParse({
          professional_status: v,
          previous_experience: null,
        }).success,
      ).toBe(true);
    }
  });

  it('rejects unknown status', () => {
    expect(
      professionalSituationSchema.safeParse({
        professional_status: 'freelance',
        previous_experience: null,
      }).success,
    ).toBe(false);
  });
});

describe('servicesSectionSchema', () => {
  it('accepts ≥1 entries', () => {
    expect(
      servicesSectionSchema.safeParse({
        entries: [
          { service_id: validUuid, unit_price: 25, override_price: false, answers: {} },
        ],
      }).success,
    ).toBe(true);
  });

  it('rejects empty entries', () => {
    expect(servicesSectionSchema.safeParse({ entries: [] }).success).toBe(false);
  });

  it('rejects negative price', () => {
    expect(
      servicesSectionSchema.safeParse({
        entries: [
          { service_id: validUuid, unit_price: -1, override_price: true, answers: {} },
        ],
      }).success,
    ).toBe(false);
  });
});

describe('saveServicesSchema', () => {
  it('rejects duplicate service_id', () => {
    expect(
      saveServicesSchema.safeParse({
        country_id: validUuid,
        entries: [
          { service_id: validUuid, unit_price: 10, override_price: false, answers: {} },
          { service_id: validUuid, unit_price: 12, override_price: false, answers: {} },
        ],
      }).success,
    ).toBe(false);
  });
});

describe('paymentsSchema', () => {
  it('accepts both enums', () => {
    expect(
      paymentsSchema.safeParse({
        has_social_security: true,
        preferred_payment: 'monthly_invoice',
      }).success,
    ).toBe(true);
    expect(
      paymentsSchema.safeParse({
        has_social_security: false,
        preferred_payment: 'accumulate_credit',
      }).success,
    ).toBe(true);
  });

  it('rejects missing boolean', () => {
    expect(
      paymentsSchema.safeParse({ preferred_payment: 'monthly_invoice' }).success,
    ).toBe(false);
  });
});

describe('languagesSectionSchema', () => {
  it('requires ≥1 language', () => {
    expect(languagesSectionSchema.safeParse({ language_codes: ['es'] }).success).toBe(true);
    expect(languagesSectionSchema.safeParse({ language_codes: [] }).success).toBe(false);
  });
});
