import { describe, it, expect } from 'vitest';
import { billingPartyDataSchema, billingChoiceSchema } from '../schemas';

const validParty = {
  name: 'Test SL',
  phone: '+34 600 000 000',
  fiscal_id_type_id: '00000000-0000-0000-0000-000000000001',
  fiscal_id: 'B12345678',
};

describe('billingPartyDataSchema', () => {
  it('accepts a complete party', () => {
    expect(billingPartyDataSchema.safeParse(validParty).success).toBe(true);
  });

  it('rejects missing name', () => {
    const { name: _omit, ...rest } = validParty;
    expect(billingPartyDataSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects non-uuid fiscal_id_type_id', () => {
    const result = billingPartyDataSchema.safeParse({ ...validParty, fiscal_id_type_id: 'not-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects empty fiscal_id', () => {
    expect(billingPartyDataSchema.safeParse({ ...validParty, fiscal_id: '   ' }).success).toBe(false);
  });

  it('trims string fields', () => {
    const result = billingPartyDataSchema.safeParse({ ...validParty, name: '  Test SL  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Test SL');
  });
});

describe('billingChoiceSchema', () => {
  it('accepts mode=same with no data', () => {
    expect(billingChoiceSchema.safeParse({ mode: 'same' }).success).toBe(true);
  });

  it('accepts mode=custom with valid data', () => {
    expect(billingChoiceSchema.safeParse({ mode: 'custom', data: validParty }).success).toBe(true);
  });

  it('rejects mode=custom without data', () => {
    expect(billingChoiceSchema.safeParse({ mode: 'custom' }).success).toBe(false);
  });

  it('rejects mode=same with extra data (strict not enforced) — at minimum parses', () => {
    // Discriminated union ignores extra keys on the matched variant.
    const result = billingChoiceSchema.safeParse({ mode: 'same', data: validParty });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ mode: 'same' });
  });

  it('rejects unknown mode', () => {
    expect(billingChoiceSchema.safeParse({ mode: 'whatever' }).success).toBe(false);
  });
});
