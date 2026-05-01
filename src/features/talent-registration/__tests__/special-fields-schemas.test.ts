import { describe, it, expect } from 'vitest';
import { servicesSchema } from '../fields/services';
import { termsAcceptedSchema } from '../fields/terms-accepted';

describe('servicesSchema', () => {
  it('accepts at least one service uuid', () => {
    expect(servicesSchema.safeParse(['550e8400-e29b-41d4-a716-446655440000']).success).toBe(true);
  });
  it('rejects empty array', () => {
    expect(servicesSchema.safeParse([]).success).toBe(false);
  });
  it('rejects non-uuid items', () => {
    expect(servicesSchema.safeParse(['not-uuid']).success).toBe(false);
  });
});

describe('termsAcceptedSchema', () => {
  it('accepts true', () => {
    expect(termsAcceptedSchema.safeParse(true).success).toBe(true);
  });
  it('rejects false (terms must be accepted)', () => {
    expect(termsAcceptedSchema.safeParse(false).success).toBe(false);
  });
  it('rejects undefined', () => {
    expect(termsAcceptedSchema.safeParse(undefined).success).toBe(false);
  });
});
