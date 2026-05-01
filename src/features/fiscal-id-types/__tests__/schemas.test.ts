import { describe, it, expect } from 'vitest';
import { fiscalIdTypeInputSchema, saveFiscalIdTypeSchema } from '../schemas';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

describe('fiscalIdTypeInputSchema', () => {
  it('accepts input without id (create) with translations and country_ids', () => {
    const result = fiscalIdTypeInputSchema.safeParse({
      code: 'NIF',
      sort_order: 0,
      is_active: true,
      translations: { es: 'NIF' },
      country_ids: [validUuid],
    });
    expect(result.success).toBe(true);
  });

  it('accepts input with existing id (update)', () => {
    const result = fiscalIdTypeInputSchema.safeParse({
      id: validUuid,
      code: 'CUIT',
      sort_order: 1,
      is_active: false,
      translations: { es: 'CUIT', en: 'Tax ID' },
      country_ids: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects lowercase code', () => {
    const result = fiscalIdTypeInputSchema.safeParse({
      code: 'nif',
      sort_order: 0,
      is_active: true,
      translations: { es: 'NIF' },
      country_ids: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects code starting with a number', () => {
    const result = fiscalIdTypeInputSchema.safeParse({
      code: '1NIF',
      sort_order: 0,
      is_active: true,
      translations: { es: 'NIF' },
      country_ids: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty translations', () => {
    const result = fiscalIdTypeInputSchema.safeParse({
      code: 'NIF',
      sort_order: 0,
      is_active: true,
      translations: {},
      country_ids: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects translation with empty label', () => {
    const result = fiscalIdTypeInputSchema.safeParse({
      code: 'NIF',
      sort_order: 0,
      is_active: true,
      translations: { es: '' },
      country_ids: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown locale', () => {
    const result = fiscalIdTypeInputSchema.safeParse({
      code: 'NIF',
      sort_order: 0,
      is_active: true,
      translations: { es: 'NIF', zz: 'Unknown' },
      country_ids: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all 5 supported locales', () => {
    const result = fiscalIdTypeInputSchema.safeParse({
      code: 'NIF',
      sort_order: 0,
      is_active: true,
      translations: { es: 'a', en: 'b', pt: 'c', fr: 'd', ca: 'e' },
      country_ids: [validUuid],
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid in country_ids', () => {
    const result = fiscalIdTypeInputSchema.safeParse({
      code: 'NIF',
      sort_order: 0,
      is_active: true,
      translations: { es: 'NIF' },
      country_ids: ['not-a-uuid'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative sort_order', () => {
    const result = fiscalIdTypeInputSchema.safeParse({
      code: 'NIF',
      sort_order: -1,
      is_active: true,
      translations: { es: 'NIF' },
      country_ids: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('saveFiscalIdTypeSchema', () => {
  it('accepts wrapped save input', () => {
    const result = saveFiscalIdTypeSchema.safeParse({
      fiscalIdType: {
        code: 'NIF',
        sort_order: 0,
        is_active: true,
        translations: { es: 'NIF' },
        country_ids: [],
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing fiscalIdType', () => {
    const result = saveFiscalIdTypeSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
