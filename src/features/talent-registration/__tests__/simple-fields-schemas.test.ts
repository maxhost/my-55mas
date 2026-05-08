import { describe, it, expect } from 'vitest';
import {
  additionalInfoSchema,
  emailSchema,
  fullNameSchema,
  marketingConsentSchema,
  passwordSchema,
} from '../fields/schemas';

describe('fullNameSchema', () => {
  it('accepts a valid name', () => {
    expect(fullNameSchema.safeParse('Ana García').success).toBe(true);
  });
  it('rejects too-short name', () => {
    expect(fullNameSchema.safeParse('A').success).toBe(false);
  });
  it('rejects too-long name', () => {
    expect(fullNameSchema.safeParse('a'.repeat(201)).success).toBe(false);
  });
});

describe('emailSchema', () => {
  it('accepts a valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true);
  });
  it('rejects malformed email', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts 8+ chars', () => {
    expect(passwordSchema.safeParse('hunter22').success).toBe(true);
  });
  it('rejects too-short password', () => {
    expect(passwordSchema.safeParse('short').success).toBe(false);
  });
  it('rejects too-long password (>72 due to bcrypt)', () => {
    expect(passwordSchema.safeParse('a'.repeat(73)).success).toBe(false);
  });
});

describe('additionalInfoSchema', () => {
  it('accepts undefined (optional)', () => {
    expect(additionalInfoSchema.safeParse(undefined).success).toBe(true);
  });
  it('accepts text within limit', () => {
    expect(additionalInfoSchema.safeParse('Some notes').success).toBe(true);
  });
  it('rejects text >2000 chars', () => {
    expect(additionalInfoSchema.safeParse('x'.repeat(2001)).success).toBe(false);
  });
});

describe('marketingConsentSchema', () => {
  it('accepts true', () => {
    expect(marketingConsentSchema.safeParse(true).success).toBe(true);
  });
  it('accepts false', () => {
    expect(marketingConsentSchema.safeParse(false).success).toBe(true);
  });
  it('rejects non-boolean', () => {
    expect(marketingConsentSchema.safeParse('yes').success).toBe(false);
  });
});
